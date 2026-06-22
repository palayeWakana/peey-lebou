import { Component, OnInit, HostListener } from '@angular/core';
import { InfoService, ContentItem, Categorie } from '../service/info.service';
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

  // Constantes pour les limites de fichiers
  private readonly MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB en bytes
  private readonly MAX_FILE_SIZE_TEXT = '1GB';

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

  // Catégories dynamiques
  categories: Categorie[] = [];
  filteredCategories: Categorie[] = [];
  filteredEditCategories: Categorie[] = [];
  showCategoryDropdown = false;
  showEditCategoryDropdown = false;
  categorySearchTerm = '';
  editCategorySearchTerm = '';

  // Variables pour le formulaire d'ajout d'actualité
  showAddForm = false;
  actualiteForm: FormGroup;
  formSubmitting = false;
  formError = '';
  formSuccess = '';
  singleImage: File | null = null;
  imagePreview: string | null = null;

  // Variables pour la suppression
  showDeleteConfirm = false;
  deleteLoading = false;
  deleteError = false;
  deleteErrorMessage = '';
  deleteMultiple = false;
  actuToDelete: ContentItem | null = null;

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

  // Variables pour gérer le popup
  showPopup: boolean = false;
  popupDescription: string = '';

  copySuccess = false;
  hasClickedCopyAdd = false;

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
      idauteur: [1],
      role: ['membre'],
      isvalid: [true],
      alaune: [false],
      wolofdescr: ['', [Validators.maxLength(200)]]
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
    this.loadCategories();
  }

  /**
   * Charge toutes les actualités puis applique le tri décroissant par ID et la pagination côté client
   */
  loadAllActus(): void {
    this.loading = true;
    this.error = false;
    this.infoService.getActus().subscribe({
      next: (data: ContentItem[]) => {
        this.allActus = data.sort((a, b) => b.id - a.id);
        this.totalItems = this.allActus.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
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
   * Ouvre la confirmation de suppression pour une seule actualité
   */
  openDeleteConfirm(actu: ContentItem): void {
    this.actuToDelete = actu;
    this.deleteMultiple = false;
    this.showDeleteConfirm = true;
    this.deleteError = false;
    this.deleteErrorMessage = '';
    document.body.style.overflow = 'hidden';
  }

  /**
   * Ferme le popup de confirmation de suppression
   */
  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.actuToDelete = null;
    this.deleteLoading = false;
    this.deleteError = false;
    this.deleteErrorMessage = '';
    this.deleteMultiple = false;
    document.body.style.overflow = '';
  }

  /**
   * Confirme et exécute la suppression avec vérification serveur
   */
  confirmDelete(): void {
    if (!this.actuToDelete) {
      this.deleteError = true;
      this.deleteErrorMessage = "Aucune actualité sélectionnée";
      return;
    }

    this.deleteLoading = true;
    this.deleteError = false;
    this.deleteErrorMessage = '';
    
    const actuId = this.actuToDelete.id;
    
    this.infoService.deleteActu(actuId).subscribe({
      next: (response) => {
        console.log('✅ Réponse de suppression:', response);
        
        // Vérifier que la suppression a réussi en rechargeant depuis le serveur
        this.verifyDeletionAndUpdate(actuId);
      },
      error: (err) => {
        console.error('❌ Erreur lors de la suppression:', err);
        
        // Si c'est une erreur 200 (réponse texte), considérer comme succès
        if (err instanceof HttpErrorResponse && err.status === 200) {
          console.log('✅ Suppression réussie (statut 200 détecté)');
          this.verifyDeletionAndUpdate(actuId);
        } else {
          this.handleDeleteError(err);
        }
      }
    });
  }

  /**
   * Vérifie que la suppression a bien été effectuée côté serveur
   * en rechargeant les données
   */
  private verifyDeletionAndUpdate(deletedId: number): void {
    console.log('🔄 Vérification de la suppression côté serveur...');
    
    this.infoService.getActus().subscribe({
      next: (data: ContentItem[]) => {
        console.log('📊 Données reçues du serveur:', data.length, 'actualités');
        
        // Vérifier si l'actualité supprimée existe encore
        const stillExists = data.some(actu => actu.id === deletedId);
        
        if (stillExists) {
          console.warn('⚠️ L\'actualité existe encore côté serveur!');
          this.deleteError = true;
          this.deleteErrorMessage = 'La suppression a échoué. L\'actualité existe encore sur le serveur.';
          this.deleteLoading = false;
        } else {
          console.log('✅ Actualité bien supprimée du serveur');
          
          // Mettre à jour les données locales avec les données du serveur
          this.allActus = data.sort((a, b) => b.id - a.id);
          this.totalItems = this.allActus.length;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          
          // Ajuster la page courante si nécessaire
          if (this.currentPage >= this.totalPages && this.totalPages > 0) {
            this.currentPage = this.totalPages - 1;
          }
          
          this.applyPagination();
          this.closeDeleteConfirm();
          
          // Afficher un message de succès temporaire
          this.showSuccessMessage('Actualité supprimée avec succès');
        }
      },
      error: (err) => {
        console.error('❌ Erreur lors de la vérification:', err);
        // En cas d'erreur de vérification, on considère quand même la suppression locale
        this.handleDeleteSuccess();
      }
    });
  }

  /**
   * Gère le succès de la suppression (fallback si vérification échoue)
   */
  private handleDeleteSuccess(): void {
    if (this.actuToDelete) {
      this.allActus = this.allActus.filter(actu => actu.id !== this.actuToDelete!.id);
      this.totalItems = this.allActus.length;
      this.totalPages = Math.ceil(this.totalItems / this.pageSize);
      
      if (this.currentPage >= this.totalPages && this.totalPages > 0) {
        this.currentPage = this.totalPages - 1;
      }
      
      this.applyPagination();
    }
    
    this.closeDeleteConfirm();
    this.showSuccessMessage('Actualité supprimée avec succès');
  }

  /**
   * Gère les erreurs de suppression
   */
  private handleDeleteError(error: any): void {
    console.error('❌ Erreur lors de la suppression:', error);
    
    this.deleteError = true;
    const errorMessage = this.handleFormError(error);
    this.deleteErrorMessage = errorMessage || 'Erreur lors de la suppression';
    this.deleteLoading = false;
  }

  /**
   * Affiche un message de succès temporaire
   */
  private showSuccessMessage(message: string): void {
    this.formSuccess = message;
    setTimeout(() => {
      this.formSuccess = '';
    }, 3000);
  }

  /**
   * Trie les actualités par ID décroissant
   */
  private sortActusByIdDesc(): void {
    this.allActus.sort((a, b) => b.id - a.id);
  }

  /**
   * Applique la pagination côté client aux données complètes
   */
  applyPagination(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.actusList = this.allActus.slice(startIndex, endIndex);
  }

  /**
   * Utilitaire pour formater la taille des fichiers
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validation avancée des fichiers image
   */
  private validateImageFile(file: File): { isValid: boolean; errorMessage?: string } {
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        errorMessage: `L'image ne doit pas dépasser ${this.MAX_FILE_SIZE_TEXT}. Taille actuelle: ${this.formatFileSize(file.size)}`
      };
    }

    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'image/bmp', 'image/tiff', 'image/tif', 'image/svg+xml'
    ];
    
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return {
        isValid: false,
        errorMessage: `Format d'image non supporté: ${file.type}. Formats autorisés: JPG, PNG, GIF, WebP, BMP, TIFF, SVG.`
      };
    }

    if (file.size === 0) {
      return {
        isValid: false,
        errorMessage: 'Le fichier semble être vide ou corrompu.'
      };
    }

    const fileName = file.name.toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif', '.svg'];
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      return {
        isValid: false,
        errorMessage: `Extension de fichier non supportée. Extensions autorisées: ${allowedExtensions.join(', ')}`
      };
    }

    return { isValid: true };
  }

  /**
   * Gestion d'erreur améliorée
   */
  private handleFormError(error: any): string {
    if (error instanceof HttpErrorResponse) {
      switch (error.status) {
        case 200:
          return '';
        case 400:
          return this.extractErrorMessage(error.error) || 'Données invalides.';
        case 401:
          return 'Vous n\'êtes pas autorisé à effectuer cette action.';
        case 403:
          return 'Accès refusé.';
        case 404:
          return 'Ressource non trouvée.';
        case 413:
          return `Fichier trop volumineux. Limite: ${this.MAX_FILE_SIZE_TEXT}.`;
        case 500:
          return 'Erreur serveur. Réessayez plus tard.';
        case 0:
          return 'Erreur de connexion. Vérifiez votre connexion Internet.';
        default:
          return this.extractErrorMessage(error.error) || `Erreur HTTP ${error.status}`;
      }
    }
    
    return error.message || 'Une erreur inattendue s\'est produite.';
  }

  /**
   * Extrait le message d'erreur depuis différents formats
   */
  private extractErrorMessage(errorBody: any): string | null {
    if (!errorBody) return null;
    if (typeof errorBody === 'string') return errorBody;
    if (typeof errorBody === 'object') {
      return errorBody.message || errorBody.error || errorBody.details || null;
    }
    return null;
  }

  // Navigation et pagination
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

  handleCardClick(event: Event, actu: any): void {
    if ((event.target as HTMLElement).closest('.see-more-btn')) {
      return;
    }
    const target = event.target as HTMLElement;
    if (target.classList.contains('validation-btn') || target.closest('.validation-btn')) {
      event.stopPropagation();
      this.toggleValidation(actu);
    } else {
      this.goToActuDetail(actu.id);
    }
  }

  toggleValidation(actu: ContentItem): void {
    const newStatus = !actu.isvalid;
    this.validationLoading[actu.id] = true;
    
    this.infoService.toggleActuValidation(newStatus, actu.id).subscribe({
      next: (updatedActu) => {
        const allIndex = this.allActus.findIndex(item => item.id === actu.id);
        if (allIndex !== -1) {
          this.allActus[allIndex].isvalid = updatedActu.isvalid;
        }
        
        const index = this.actusList.findIndex(item => item.id === actu.id);
        if (index !== -1) {
          this.actusList[index].isvalid = updatedActu.isvalid;
        }
        this.validationLoading[actu.id] = false;
      },
      error: (err) => {
        console.error('Erreur validation:', err);
        this.validationLoading[actu.id] = false;
      }
    });
  }

  isDescriptionLong(description: string): boolean {
    return description.length > 150;
  }

  openDescriptionPopup(description: string): void {
    this.popupDescription = description;
    this.showPopup = true;
    document.body.style.overflow = 'hidden';
  }

  closeDescriptionPopup(): void {
    this.showPopup = false;
    document.body.style.overflow = '';
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    this.showCategoryDropdown = false;
    this.categorySearchTerm = '';
    this.filteredCategories = [...this.categories];
    if (!this.showAddForm) {
      this.actualiteForm.reset({
        date: new Date().toISOString().split('T')[0],
        idauteur: 1,
        role: 'membre',
        isvalid: true,
        alaune: false,
        wolofdescr: ''
      });
      this.singleImage = null;
      this.imagePreview = null;
      this.formError = '';
      this.formSuccess = '';
      this.hasClickedCopyAdd = false;
    }
  }

  onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const validation = this.validateImageFile(file);
      
      if (!validation.isValid) {
        this.formError = validation.errorMessage!;
        input.value = '';
        this.singleImage = null;
        this.imagePreview = null;
        return;
      }
      
      this.formError = '';
      this.singleImage = file;
      
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.onerror = () => {
        this.formError = 'Erreur lors de la lecture du fichier.';
        this.singleImage = null;
        this.imagePreview = null;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.singleImage = null;
    this.imagePreview = null;
    this.formError = '';
    const input = document.getElementById('image') as HTMLInputElement;
    if (input) input.value = '';
  }

  private validateFormData(): string | null {
    const formValue = this.actualiteForm.value;
    
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
    
    const validation = this.validateImageFile(this.singleImage);
    if (!validation.isValid) {
      return validation.errorMessage!;
    }
    
    return null;
  }

  copyWolofPrompt(): void {
    const description = this.actualiteForm.get('descr')?.value || '';
    const prompt = `Tu es un expert en traduction et résumé en langue wolof (Sénégal).\nRésume le texte suivant en wolof en maximum 200 caractères (espaces inclus). Le résumé doit être fluide, naturel et compréhensible par un locuteur wolof natif. N'utilise pas de mots français sauf si le terme n'existe pas en wolof. Ne dépasse jamais 200 caractères.\nTexte à résumer :\n${description}`;
    navigator.clipboard.writeText(prompt).then(() => {
      this.copySuccess = true;
      this.hasClickedCopyAdd = true;
      setTimeout(() => { this.copySuccess = false; }, 2000);
    }).catch(() => {});
  }

  submitActualite(): void {
    this.formError = '';
    this.formSuccess = '';
    
    if (!this.actualiteForm.valid) {
      Object.keys(this.actualiteForm.controls).forEach(field => {
        this.actualiteForm.get(field)?.markAsTouched({ onlySelf: true });
      });
      this.formError = 'Veuillez remplir correctement tous les champs obligatoires.';
      return;
    }
    
    const validationError = this.validateFormData();
    if (validationError) {
      this.formError = validationError;
      return;
    }

    this.formSubmitting = true;
    const formData = new FormData();
    const formValue = this.actualiteForm.value;

    formData.append('titre', formValue.titre.trim());
    formData.append('descr', formValue.descr.trim());
    formData.append('lien', formValue.lien?.trim() || '');
    formData.append('categorie', formValue.categorie);
    formData.append('date', formValue.date || new Date().toISOString().split('T')[0]);
    formData.append('idauteur', (formValue.idauteur || 1).toString());
    formData.append('wolofdescr', formValue.wolofdescr?.trim() || '');

    if (this.singleImage) {
      formData.append('file', this.singleImage, this.singleImage.name);
    }
    
    this.infoService.createActualite(formData).subscribe({
      next: (newActu) => {
        this.allActus.unshift(newActu);
        this.sortActusByIdDesc();
        this.totalItems = this.allActus.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.currentPage = 0;
        this.applyPagination();
        
        this.actualiteForm.reset({
          date: new Date().toISOString().split('T')[0],
          idauteur: 1,
          role: 'membre',
          isvalid: true,
          alaune: false,
          wolofdescr: ''
        });
        this.singleImage = null;
        this.imagePreview = null;
        this.formSubmitting = false;
        this.formSuccess = 'Actualité créée avec succès!';
        
        setTimeout(() => {
          this.formSuccess = '';
          this.toggleAddForm();
        }, 2000);
      },
      error: (error) => {
        this.formError = this.handleFormError(error);
        this.formSubmitting = false;
      }
    });
  }

  openEditForm(actu: ContentItem): void {
    this.currentEditActu = actu;
    this.currentEditImage = this.baseUrl + actu.img;
    
    const dateFormatted = new Date(actu.date).toISOString().split('T')[0];
    
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
    
    this.editSingleImage = null;
    this.editImagePreview = null;
    this.editFormError = '';
    this.editFormSuccess = '';
    this.showEditForm = true;
    this.showEditCategoryDropdown = false;
    this.editCategorySearchTerm = '';
    this.filteredEditCategories = [...this.categories];
  }

  toggleEditForm(): void {
    this.showEditForm = !this.showEditForm;
    this.showEditCategoryDropdown = false;
    this.editCategorySearchTerm = '';
    this.filteredEditCategories = [...this.categories];
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

  onEditImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const validation = this.validateImageFile(file);
      
      if (!validation.isValid) {
        this.editFormError = validation.errorMessage!;
        input.value = '';
        this.editSingleImage = null;
        this.editImagePreview = null;
        return;
      }
      
      this.editFormError = '';
      this.editSingleImage = file;
      
      const reader = new FileReader();
      reader.onload = () => {
        this.editImagePreview = reader.result as string;
      };
      reader.onerror = () => {
        this.editFormError = 'Erreur lors de la lecture du fichier.';
        this.editSingleImage = null;
        this.editImagePreview = null;
      };
      reader.readAsDataURL(file);
    }
  }

  removeEditImage(): void {
    this.editSingleImage = null;
    this.editImagePreview = null;
    this.editFormError = '';
    const input = document.getElementById('edit-image') as HTMLInputElement;
    if (input) input.value = '';
  }

  private validateEditFormData(): string | null {
    const formValue = this.editForm.value;
    
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
    
    if (this.editSingleImage) {
      const validation = this.validateImageFile(this.editSingleImage);
      if (!validation.isValid) {
        return validation.errorMessage!;
      }
    }
    
    return null;
  }

  submitEditActualite(): void {
    this.editFormError = '';
    this.editFormSuccess = '';
    
    if (!this.editForm.valid || !this.currentEditActu) {
      Object.keys(this.editForm.controls).forEach(field => {
        this.editForm.get(field)?.markAsTouched({ onlySelf: true });
      });
      this.editFormError = 'Veuillez remplir correctement tous les champs obligatoires.';
      return;
    }
    
    const validationError = this.validateEditFormData();
    if (validationError) {
      this.editFormError = validationError;
      return;
    }

    this.editFormSubmitting = true;
    const formData = new FormData();
    const formValue = this.editForm.value;

    formData.append('titre', formValue.titre.trim());
    formData.append('descr', formValue.descr.trim());
    formData.append('lien', formValue.lien?.trim() || '');
    formData.append('categorie', formValue.categorie);
    formData.append('date', formValue.date || new Date().toISOString().split('T')[0]);
    formData.append('idauteur', (formValue.idauteur || this.currentEditActu.idauteur || 1).toString());

    if (this.editSingleImage) {
      formData.append('file', this.editSingleImage, this.editSingleImage.name);
    }
    
    this.infoService.updateActu(this.currentEditActu.id, formData).subscribe({
      next: (updatedActu) => {
        if (!updatedActu.img && this.currentEditActu?.img) {
          updatedActu.img = this.currentEditActu.img;
        }
        
        const allIndex = this.allActus.findIndex(item => item.id === this.currentEditActu!.id);
        if (allIndex !== -1) {
          this.allActus[allIndex] = updatedActu;
        }
        
        const pageIndex = this.actusList.findIndex(item => item.id === this.currentEditActu!.id);
        if (pageIndex !== -1) {
          this.actusList[pageIndex] = updatedActu;
        }
        
        this.sortActusByIdDesc();
        this.applyPagination();
        
        this.editFormSubmitting = false;
        this.editFormSuccess = 'Actualité modifiée avec succès!';
        
        setTimeout(() => {
          this.editFormSuccess = '';
          this.toggleEditForm();
        }, 2000);
      },
      error: (error) => {
        console.error('Erreur modification:', error);
        this.editFormError = this.handleFormError(error);
        this.editFormSubmitting = false;
        
        if (error.status === 413 || error.status === 0) {
          this.editFormError += ' Essayez de compresser votre image.';
        }
      }
    });
  }

  private logFormData(formData: FormData): void {
    formData.forEach((value, key) => {
      console.log(`${key}:`, value);
    });
  }

  // Chargement des catégories depuis le service
  loadCategories(): void {
    this.infoService.getCategorieByType('Actualités').subscribe({
      next: (data: Categorie[]) => {
        this.categories = data;
        this.filteredCategories = [...data];
        this.filteredEditCategories = [...data];
      },
      error: (err) => {
        console.error('Erreur lors du chargement des catégories:', err);
      }
    });
  }

  // Toggle du dropdown pour l'ajout
  toggleCategoryDropdown(): void {
    this.showCategoryDropdown = !this.showCategoryDropdown;
    if (this.showCategoryDropdown) {
      this.categorySearchTerm = '';
      this.filteredCategories = [...this.categories];
      this.showEditCategoryDropdown = false;
    }
  }

  // Toggle du dropdown pour l'édition
  toggleEditCategoryDropdown(): void {
    this.showEditCategoryDropdown = !this.showEditCategoryDropdown;
    if (this.showEditCategoryDropdown) {
      this.editCategorySearchTerm = '';
      this.filteredEditCategories = [...this.categories];
      this.showCategoryDropdown = false;
    }
  }

  // Filtrage des catégories (Ajout)
  filterCategories(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.categorySearchTerm = input.value;
    const term = this.categorySearchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredCategories = [...this.categories];
    } else {
      this.filteredCategories = this.categories.filter(cat => 
        cat.libelle.toLowerCase().includes(term) || 
        cat.type.toLowerCase().includes(term)
      );
    }
  }

  // Filtrage des catégories (Modification)
  filterEditCategories(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editCategorySearchTerm = input.value;
    const term = this.editCategorySearchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredEditCategories = [...this.categories];
    } else {
      this.filteredEditCategories = this.categories.filter(cat => 
        cat.libelle.toLowerCase().includes(term) || 
        cat.type.toLowerCase().includes(term)
      );
    }
  }

  // Sélection d'une catégorie (Ajout)
  selectCategory(cat: Categorie): void {
    this.actualiteForm.patchValue({ categorie: cat.libelle });
    this.actualiteForm.get('categorie')?.markAsTouched();
    this.showCategoryDropdown = false;
  }

  // Sélection d'une catégorie (Modification)
  selectEditCategory(cat: Categorie): void {
    this.editForm.patchValue({ categorie: cat.libelle });
    this.editForm.get('categorie')?.markAsTouched();
    this.showEditCategoryDropdown = false;
  }

  // Fermeture des dropdowns si clic à l'extérieur
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-select-container')) {
      this.showCategoryDropdown = false;
      this.showEditCategoryDropdown = false;
    }
  }
}