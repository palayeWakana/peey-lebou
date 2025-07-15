import { Component, OnInit } from '@angular/core';
import { InfoService, ContentItem } from '../service/info.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

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

  // Variables pour le formulaire de modification
  showEditForm = false;
  editForm: FormGroup;
  editFormSubmitting = false;
  editFormError = '';
  editFormSuccess = '';
  editSingleImage: File | null = null;
  editImagePreview: string | null = null;
  currentEditActu: ContentItem | null = null;
  currentEditImage: string | null = null;

  constructor(
    private infoService: InfoService,
    private router: Router,
    private fb: FormBuilder
  ) {
    // Initialisation du formulaire d'ajout
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

    // Initialisation du formulaire de modification
    this.editForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(5)]],
      descr: ['', [Validators.required, Validators.minLength(10)]],
      lien: [''],
      categorie: ['', Validators.required],
      date: ['', Validators.required],
      auteur: ['', Validators.required],
      idauteur: [1],
      role: ['membre'],
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
   * Gère le changement de fichier d'image pour l'ajout
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
   * Supprime l'image sélectionnée pour l'ajout
   */
  removeImage(): void {
    this.singleImage = null;
    this.imagePreview = null;
    // Réinitialiser l'input file
    const input = document.getElementById('image') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  /**
   * Debug FormData - Méthode pour afficher le contenu du FormData
   */
  private logFormData(formData: FormData): void {
    console.log('FormData content:');
    
    // Utiliser une approche compatible avec tous les navigateurs
    const keys = ['titre', 'descr', 'lien', 'categorie', 'date', 'auteur', 'idauteur', 'role', 'isvalid', 'alaune'];
    
    keys.forEach(key => {
      const value = formData.get(key);
      if (value !== null) {
        console.log(`${key}:`, value);
      }
    });
    
    // Vérifier si le fichier est présent
    const file = formData.get('file');
    if (file) {
      console.log('file:', file);
    }
    
    // Alternative pour les navigateurs modernes (avec vérification)
    // try {
    //   if (formData.entries && typeof formData.entries === 'function') {
    //     console.log('--- FormData entries (méthode moderne) ---');
    //     for (const [key, value] of formData.entries()) {
    //       console.log(key, value);
    //     }
    //   }
    // } catch (error) {
    //   console.log('FormData.entries() non supporté dans ce navigateur');
    // }
  }

  /**
   * Gestion d'erreur améliorée
   */
  private handleFormError(error: any): string {
    console.error('Erreur complète:', error);
    
    if (error instanceof HttpErrorResponse) {
      console.error('Status:', error.status);
      console.error('Status Text:', error.statusText);
      console.error('Error body:', error.error);
      
      // Gestion spécifique des erreurs HTTP
      switch (error.status) {
        case 400:
          return error.error?.message || 'Données invalides. Veuillez vérifier les champs.';
        case 401:
          return 'Vous n\'êtes pas autorisé à effectuer cette action.';
        case 403:
          return 'Accès refusé. Vérifiez vos permissions.';
        case 404:
          return 'Service non trouvé. Veuillez contacter l\'administrateur.';
        case 413:
          return 'Fichier trop volumineux. Veuillez choisir une image plus petite.';
        case 422:
          return 'Données non traitables. Vérifiez le format de vos données.';
        case 500:
          return 'Erreur interne du serveur. Veuillez réessayer plus tard.';
        default:
          return error.error?.message || `Erreur HTTP ${error.status}: ${error.statusText}`;
      }
    }
    
    // Erreur réseau ou autre
    if (error.name === 'NetworkError' || error.message?.includes('Network')) {
      return 'Erreur de connexion. Vérifiez votre connexion Internet.';
    }
    
    // Erreur générique
    return error.message || 'Une erreur inattendue s\'est produite.';
  }

  /**
   * Valide les données avant l'envoi
   */
  private validateFormData(): string | null {
    const formValue = this.actualiteForm.value;
    
    // Vérifications supplémentaires
    if (!formValue.titre || formValue.titre.trim().length < 5) {
      return 'Le titre doit contenir au moins 5 caractères.';
    }
    
    if (!formValue.descr || formValue.descr.trim().length < 10) {
      return 'La description doit contenir au moins 10 caractères.';
    }
    
    if (!formValue.categorie) {
      return 'Veuillez sélectionner une catégorie.';
    }
    
    if (!formValue.auteur || formValue.auteur.trim().length === 0) {
      return 'Le nom de l\'auteur est requis.';
    }
    
    if (!this.singleImage) {
      return 'Veuillez sélectionner une image.';
    }
    
    // Vérifier la taille du fichier (5MB max)
    if (this.singleImage.size > 5 * 1024 * 1024) {
      return 'L\'image ne doit pas dépasser 5MB.';
    }
    
    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(this.singleImage.type)) {
      return 'Format d\'image non supporté. Utilisez JPG, PNG, GIF ou WebP.';
    }
    
    return null;
  }

  /**
   * Soumet le formulaire pour créer une actualité
   */
  submitActualite(): void {
    this.formError = '';
    this.formSuccess = '';
    
    if (!this.actualiteForm.valid) {
      // Marquer tous les contrôles comme touchés pour afficher les erreurs
      Object.keys(this.actualiteForm.controls).forEach(field => {
        const control = this.actualiteForm.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
      this.formError = 'Veuillez remplir correctement tous les champs obligatoires.';
      return;
    }
    
    // Validation supplémentaire
    const validationError = this.validateFormData();
    if (validationError) {
      this.formError = validationError;
      return;
    }

    this.formSubmitting = true;

    const formData = new FormData();
    const formValue = this.actualiteForm.value;
    
    // Ajouter les champs avec validation
    formData.append('titre', (formValue.titre || '').trim());
    formData.append('descr', (formValue.descr || '').trim());
    formData.append('lien', (formValue.lien || '').trim());
    formData.append('categorie', formValue.categorie || '');
    formData.append('date', formValue.date || '');
    formData.append('auteur', (formValue.auteur || '').trim());
    formData.append('idauteur', formValue.idauteur ? formValue.idauteur.toString() : '1');
    formData.append('role', formValue.role || 'membre');
    formData.append('isvalid', formValue.isvalid ? 'true' : 'false');
    formData.append('alaune', formValue.alaune ? 'true' : 'false');

    // Ajouter l'image
    if (this.singleImage) {
      formData.append('file', this.singleImage, this.singleImage.name);
    }
    
    // Debug: Afficher le contenu du FormData
    this.logFormData(formData);
    
    // Envoyer la requête
    this.infoService.createActualite(formData).subscribe({
      next: (newActu) => {
        console.log('Actualité créée avec succès:', newActu);
        
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
      error: (error) => {
        console.error('Erreur lors de la création:', error);
        this.formError = this.handleFormError(error);
        this.formSubmitting = false;
      }
    });
  }

  // ===============================
  // MÉTHODES POUR LA MODIFICATION
  // ===============================

  /**
   * Ouvre le formulaire de modification avec les données de l'actualité
   */
  openEditForm(actu: ContentItem): void {
    this.currentEditActu = actu;
    this.currentEditImage = this.baseUrl + actu.img;
    
    // Formater la date pour l'input date
    const dateFormatted = new Date(actu.date).toISOString().split('T')[0];
    
    // Remplir le formulaire avec les données existantes
    this.editForm.patchValue({
      titre: actu.titre,
      descr: actu.descr,
      lien: actu.lien || '',
      categorie: actu.categorie,
      date: dateFormatted,
      auteur: actu.auteur,
      idauteur: actu.idauteur,
      role: actu.role,
      isvalid: actu.isvalid,
      alaune: actu.alaUne
    });
    
    // Réinitialiser les variables d'image
    this.editSingleImage = null;
    this.editImagePreview = null;
    this.editFormError = '';
    this.editFormSuccess = '';
    
    this.showEditForm = true;
  }

  /**
   * Ferme le formulaire de modification
   */
  toggleEditForm(): void {
    this.showEditForm = !this.showEditForm;
    if (!this.showEditForm) {
      this.currentEditActu = null;
      this.currentEditImage = null;
      this.editSingleImage = null;
      this.editImagePreview = null;
      this.editFormError = '';
      this.editFormSuccess = '';
      this.editForm.reset();
    }
  }

  /**
   * Gère le changement de fichier d'image pour la modification
   */
  onEditImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.editSingleImage = input.files[0];
      
      // Créer une URL pour prévisualiser l'image
      const reader = new FileReader();
      reader.onload = () => {
        this.editImagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.editSingleImage);
    }
  }

  /**
   * Supprime l'image sélectionnée pour la modification
   */
  removeEditImage(): void {
    this.editSingleImage = null;
    this.editImagePreview = null;
    // Réinitialiser l'input file
    const input = document.getElementById('edit-image') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  /**
   * Soumet le formulaire de modification
   */
  submitEditActualite(): void {
    if (!this.currentEditActu) {
      this.editFormError = 'Aucune actualité sélectionnée pour la modification';
      return;
    }

    if (this.editForm.valid) {
      this.editFormSubmitting = true;
      this.editFormError = '';

      const formData = new FormData();
      
      // Ajouter les champs du formulaire à FormData avec la bonne conversion
      const formValue = this.editForm.value;
      
      formData.append('titre', (formValue.titre || '').trim());
      formData.append('descr', (formValue.descr || '').trim());
      formData.append('lien', (formValue.lien || '').trim());
      formData.append('categorie', formValue.categorie || '');
      formData.append('date', formValue.date || '');
      formData.append('auteur', (formValue.auteur || '').trim());
      formData.append('idauteur', formValue.idauteur ? formValue.idauteur.toString() : '1');
      formData.append('role', formValue.role || 'membre');
      formData.append('isvalid', formValue.isvalid ? 'true' : 'false');
      formData.append('alaune', formValue.alaune ? 'true' : 'false');

      // Ajouter l'image seulement si une nouvelle image a été sélectionnée
      if (this.editSingleImage) {
        formData.append('file', this.editSingleImage, this.editSingleImage.name);
      }
      
      // Debug FormData
      this.logFormData(formData);
      
      // Envoyer la requête de modification
      this.infoService.updateActu(this.currentEditActu.id, formData).subscribe({
        next: (updatedActu) => {
          // Mettre à jour l'actualité dans la liste complète
          const allIndex = this.allActus.findIndex(item => item.id === this.currentEditActu!.id);
          if (allIndex !== -1) {
            this.allActus[allIndex] = updatedActu;
          }
          
          // Mettre à jour l'actualité dans la liste paginée
          const index = this.actusList.findIndex(item => item.id === this.currentEditActu!.id);
          if (index !== -1) {
            this.actusList[index] = updatedActu;
          }
          
          this.editFormSubmitting = false;
          this.editFormSuccess = 'Actualité modifiée avec succès!';
          
          // Fermer le formulaire après 2 secondes
          setTimeout(() => {
            this.editFormSuccess = '';
            this.toggleEditForm();
          }, 2000);
        },
        error: (error) => {
          console.error('Erreur lors de la modification:', error);
          this.editFormError = this.handleFormError(error);
          this.editFormSubmitting = false;
        }
      });
    } else {
      // Marquer tous les contrôles comme touchés pour afficher les erreurs
      Object.keys(this.editForm.controls).forEach(field => {
        const control = this.editForm.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
      this.editFormError = 'Veuillez remplir correctement tous les champs obligatoires';
    }
  }
}