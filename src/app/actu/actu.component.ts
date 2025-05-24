import { Component, OnInit } from '@angular/core';
import { InfoService, ContentItem } from './../info.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-actu',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ReactiveFormsModule],
  templateUrl: './actu.component.html',
  styleUrls: ['./actu.component.css']
})
export class ActuComponent implements OnInit {
  baseUrl = 'https://peeyconnect.net/repertoire_upload/';

  // Données complètes
  allActus: ContentItem[] = [];
  
  // Données paginées
  actusList: ContentItem[] = [];
  currentPage = 0;
  pageSize = 4;
  totalPages = 0;
  totalItems = 0;
  loading = true;
  error = false;
  validationLoading: { [key: number]: boolean } = {};

  // Variables pour le formulaire d'ajout d'actualité
  showAddForm = false;
  actualiteForm: FormGroup;
  formSubmitting = false;
  formError = '';
  formSuccess = '';
  singleImage: File | null = null;
  imagePreview: string | null = null;

  constructor(
    private infoService: InfoService,
    private router: Router,
    private fb: FormBuilder
  ) {
    // Initialisation du formulaire
    this.actualiteForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(5)]],
      descr: ['', [Validators.required, Validators.minLength(10)]],
      lien: [''],
      categorie: ['', Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      auteur: ['', Validators.required],
      idauteur: [1], // Valeur par défaut ou à récupérer d'un service d'authentification
      role: ['membre'], // Valeur par défaut
      isvalid: [true],
      alaune: [false]
    });
  }

  ngOnInit(): void {
    this.loadAllActus();
  }

  /**
   * Charge toutes les actualités puis applique la pagination côté client
   */
  loadAllActus(): void {
    this.loading = true;
    this.infoService.getActus().subscribe({
      next: (data: ContentItem[]) => {
        this.allActus = data;
        this.totalItems = data.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        
        // Appliquer la pagination initiale
        this.applyPagination();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des actualités', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  /**
   * Applique la pagination côté client aux données complètes
   */
  applyPagination(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.actusList = this.allActus.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.applyPagination();
      window.scrollTo(0, 0);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.goToPage(this.currentPage - 1);
    }
  }

  goToActuDetail(id: number): void {
    this.router.navigate(['/actualites', id]);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(0, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(this.totalPages - 1, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(0, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }
  
  /**
   * Gérer le clic sur une carte d'actualité
   * Détermine si l'utilisateur a cliqué sur le bouton de validation ou sur la carte
   */
  handleCardClick(event: Event, actu: any): void {
    // Vérifie si le clic vient du bouton "Voir plus"
    if ((event.target as HTMLElement).closest('.see-more-btn')) {
      return;
    }
    const target = event.target as HTMLElement;
    if (target.classList.contains('validation-btn') || 
        target.closest('.validation-btn')) {
      event.stopPropagation(); // Empêche la navigation vers les détails
      this.toggleValidation(actu);
    } else {
      // Si clic ailleurs sur la carte, aller aux détails
      this.goToActuDetail(actu.id);
    }
  }
  
  /**
   * Changer le statut de validation d'une actualité
   */
  toggleValidation(actu: ContentItem): void {
    // Status opposé à l'état actuel
    const newStatus = !actu.isvalid;
    this.validationLoading[actu.id] = true;
    
    this.infoService.toggleActuValidation(newStatus, actu.id).subscribe({
      next: (updatedActu) => {
        // Mettre à jour l'actualité avec les nouvelles informations dans les deux tableaux
        // 1. Dans la liste complète
        const allIndex = this.allActus.findIndex(item => item.id === actu.id);
        if (allIndex !== -1) {
          this.allActus[allIndex].isvalid = updatedActu.isvalid;
        }
        
        // 2. Dans la liste paginée
        const index = this.actusList.findIndex(item => item.id === actu.id);
        if (index !== -1) {
          this.actusList[index].isvalid = updatedActu.isvalid;
        }
        this.validationLoading[actu.id] = false;
      },
      error: (err) => {
        console.error(`Erreur lors de la ${newStatus ? 'validation' : 'invalidation'} de l'actualité`, err);
        this.validationLoading[actu.id] = false;
      }
    });
  }

  // pour le popup 
  // Variables pour gérer le popup
  showPopup: boolean = false;
  popupDescription: string = '';

  // Méthode pour vérifier si la description est trop longue
  isDescriptionLong(description: string): boolean {
    return description.length > 150; // Ajustez selon vos besoins
  }

  // Méthode pour ouvrir le popup
  openDescriptionPopup(description: string): void {
    this.popupDescription = description;
    this.showPopup = true;
    document.body.style.overflow = 'hidden'; // Empêche le défilement de la page
  }

  // Méthode pour fermer le popup
  closeDescriptionPopup(): void {
    this.showPopup = false;
    document.body.style.overflow = ''; // Rétablit le défilement
  }

  // Nouvelles méthodes pour le formulaire d'ajout d'actualité
  
  /**
   * Affiche/cache le formulaire d'ajout d'actualité
   */
  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      // Réinitialiser le formulaire si on le ferme
      this.actualiteForm.reset({
        date: new Date().toISOString().split('T')[0],
        idauteur: 1,
        role: 'membre',
        isvalid: true,
        alaune: false
      });
      this.singleImage = null;
      this.imagePreview = null;
      this.formError = '';
      this.formSuccess = '';
    }
  }

  /**
   * Gère le changement de fichier d'image
   */
  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.singleImage = input.files[0];
      
      // Créer une URL pour prévisualiser l'image
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.singleImage);
    }
  }

  /**
   * Soumet le formulaire pour créer une actualité
   */
  submitActualite(): void {
    if (this.actualiteForm.valid) {
      if (!this.singleImage) {
        this.formError = 'Veuillez sélectionner une image';
        return;
      }

      this.formSubmitting = true;
      this.formError = '';

      const formData = new FormData();
      
      // Ajouter les champs du formulaire à FormData
      Object.keys(this.actualiteForm.controls).forEach(key => {
        formData.append(key, this.actualiteForm.get(key)?.value);
      });

      // Ajouter l'image
      formData.append('file', this.singleImage, this.singleImage.name);
      
      // Envoyer la requête
      this.infoService.createActualite(formData).subscribe({
        next: (newActu) => {
          // Ajouter l'actualité à la liste et rafraîchir
          this.allActus.unshift(newActu);
          this.totalItems = this.allActus.length;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          this.applyPagination();
          
          // Réinitialiser le formulaire
          this.actualiteForm.reset({
            date: new Date().toISOString().split('T')[0],
            idauteur: 1,
            role: 'membre',
            isvalid: true,
            alaune: false
          });
          this.singleImage = null;
          this.imagePreview = null;
          this.formSubmitting = false;
          this.formSuccess = 'Actualité créée avec succès!';
          
          // Fermer le formulaire après 2 secondes
          setTimeout(() => {
            this.formSuccess = '';
            this.toggleAddForm();
          }, 2000);
        },
        error: (err) => {
          console.error('Erreur lors de la création de l\'actualité', err);
          this.formError = 'Une erreur est survenue lors de la création de l\'actualité';
          this.formSubmitting = false;
        }
      });
    } else {
      // Marquer tous les contrôles comme touchés pour afficher les erreurs
      Object.keys(this.actualiteForm.controls).forEach(field => {
        const control = this.actualiteForm.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
      this.formError = 'Veuillez remplir correctement tous les champs obligatoires';
    }
  }
}