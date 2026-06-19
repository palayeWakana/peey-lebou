import { SidebarComponent } from './../sidebar/sidebar.component';
import { Component, OnInit } from '@angular/core';
import { OpportuniteService, OpportuniteResponse, OpportuniteItem } from '../service/opportinute.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-oppor',
  standalone: true,
  imports: [CommonModule, SidebarComponent, ReactiveFormsModule],
  templateUrl: './oppor.component.html',
  styleUrls: ['./oppor.component.css']
})
export class OpporComponent implements OnInit {
  // Constantes pour les limites de fichiers - AUGMENTÉE À 1GB
  private readonly MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1 GB en bytes
  private readonly MAX_FILE_SIZE_TEXT = '1GB';

  opporList: OpportuniteItem[] = [];
  currentPage = 0;
  pageSize = 4;
  totalPages = 0;
  totalItems = 0;
  loading = true;
  error = false;
  processingId: number | null = null;

  // Propriétés pour le popup de description
  showPopup = false;
  popupDescription = '';

  // Propriétés pour le popup d'ajout
  showAddPopup = false;
  opportuniteForm: FormGroup;
  selectedImage: File | null = null;
  previewImage: string | null = null;
  saveLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Propriétés pour le popup de modification
  showEditPopup = false;
  editOpportuniteForm: FormGroup;
  editSelectedImage: File | null = null;
  editPreviewImage: string | null = null;
  editCurrentImage: string | null = null;
  editLoading = false;
  editErrorMessage: string | null = null;
  editSuccessMessage: string | null = null;
  currentEditOpportunite: OpportuniteItem | null = null;

  // Variables pour la suppression
  showDeleteConfirm = false;
  deleteLoading = false;
  deleteError = false;
  deleteErrorMessage = '';
  deleteMultiple = false;
  opporToDelete: OpportuniteItem | null = null;

  // URL de base pour les images provenant du backend
  imageBaseUrl = 'https://peeyconnect.net/repertoire_upload/';
  opportunite: any;

  copySuccess = false;
  editCopySuccess = false;

  constructor(
    private opportuniteService: OpportuniteService,
    private router: Router,
    private fb: FormBuilder
  ) {
    // Formulaire d'ajout
    this.opportuniteForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      descr: ['', [Validators.required, Validators.minLength(10)]],
      lien: ['', Validators.required],
      categorie: ['', Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      wolofdescr: ['', [Validators.maxLength(200)]]
    });

    // Formulaire de modification
    this.editOpportuniteForm = this.fb.group({
      titre: ['', [Validators.required, Validators.minLength(3)]],
      descr: ['', [Validators.required, Validators.minLength(10)]],
      lien: ['', Validators.required],
      categorie: ['', Validators.required],
      date: ['', Validators.required],
      isvalid: [false],
      alaune: [false],
      wolofdescr: ['', [Validators.maxLength(200)]]
    });
  }

  ngOnInit(): void {
    this.loadOpportunites(this.currentPage);
  }

  /**
   * Utilitaire pour formater la taille des fichiers en lecture humaine
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validation avancée des fichiers image - LIMITE 1GB
   */
  private validateImageFile(file: File): { isValid: boolean; errorMessage?: string } {
    // Vérifier la taille du fichier (1GB max)
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        errorMessage: `L'image ne doit pas dépasser ${this.MAX_FILE_SIZE_TEXT}. Taille actuelle: ${this.formatFileSize(file.size)}`
      };
    }

    // Vérifier le type de fichier (types supportés étendus)
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/gif', 
      'image/webp',
      'image/bmp',
      'image/tiff',
      'image/tif',
      'image/svg+xml'
    ];
    
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return {
        isValid: false,
        errorMessage: `Format d'image non supporté: ${file.type}. Formats autorisés: JPG, PNG, GIF, WebP, BMP, TIFF, SVG.`
      };
    }

    // Vérifications supplémentaires pour détecter les fichiers corrompus
    if (file.size === 0) {
      return {
        isValid: false,
        errorMessage: 'Le fichier semble être vide ou corrompu.'
      };
    }

    // Vérifier l'extension du fichier
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

  loadOpportunites(page: number): void {
    this.loading = true;
    
    this.opportuniteService.getAllOpportunite().subscribe({
      next: (opportunites: OpportuniteItem[]) => {
        // Trier les opportunités du plus récent au plus ancien
        const sortedOpportunites = this.sortOpportunitesByIdDescending(opportunites);
        
        // Traiter les images
        const processedOpportunites = sortedOpportunites.map(oppor => ({
          ...oppor,
          img: oppor.img ? `${this.imageBaseUrl}${oppor.img}` : 'assets/images/placeholder.jpg',
          auteurimg: oppor.auteurimg ? `${this.imageBaseUrl}${oppor.auteurimg}` : 'assets/images/user-placeholder.jpg'
        }));
        
        // Calculer la pagination côté client
        this.totalItems = processedOpportunites.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        
        // Paginer les résultats côté client
        const startIndex = page * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.opporList = processedOpportunites.slice(startIndex, endIndex);
        
        this.currentPage = page;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des opportunités', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  private sortOpportunitesByIdDescending(opportunites: OpportuniteItem[]): OpportuniteItem[] {
    return opportunites.sort((a, b) => {
      // Convertir les IDs en nombres pour une comparaison numérique correcte
      const idA = Number(a.id);
      const idB = Number(b.id);
      
      // Tri décroissant : les IDs les plus élevés (plus récents) en premier
      return idB - idA;
    });
  }

  toggleValidation(event: Event, oppor: OpportuniteItem): void {
    event.stopPropagation();
    this.processingId = oppor.id;
    const newStatus = !oppor.isvalid;
    
    this.opportuniteService.toggleValidation(oppor.id, newStatus).subscribe({
      next: (updatedOppor) => {
        const index = this.opporList.findIndex(o => o.id === oppor.id);
        if (index !== -1) {
          this.opporList[index].isvalid = updatedOppor.isvalid;
        }
        this.processingId = null;
      },
      error: (err) => {
        console.error('Erreur lors de la validation/invalidation:', err);
        this.processingId = null;
      }
    });
  }

  // Méthodes pour la gestion du popup d'ajout
  openAddOpportunitePopup(): void {
    this.showAddPopup = true;
    this.resetForm();
    document.body.style.overflow = 'hidden';
  }

  closeAddOpportunitePopup(): void {
    this.showAddPopup = false;
    this.resetForm();
    document.body.style.overflow = '';
  }

  openEditPopup(oppor: OpportuniteItem): void {
    this.openEditOpportunitePopup(oppor);
  }
  
  copyWolofPrompt(): void {
    const description = this.opportuniteForm.get('descr')?.value || '';
    const prompt = `Tu es un expert en traduction et résumé en langue wolof (Sénégal).\nRésume le texte suivant en wolof en maximum 200 caractères (espaces inclus). Le résumé doit être fluide, naturel et compréhensible par un locuteur wolof natif. N'utilise pas de mots français sauf si le terme n'existe pas en wolof. Ne dépasse jamais 200 caractères.\nTexte à résumer :\n${description}`;
    navigator.clipboard.writeText(prompt).then(() => {
      this.copySuccess = true;
      setTimeout(() => { this.copySuccess = false; }, 2000);
    }).catch(() => {});
  }

  copyEditWolofPrompt(): void {
    const description = this.editOpportuniteForm.get('descr')?.value || '';
    const prompt = `Tu es un expert en traduction et résumé en langue wolof (Sénégal).\nRésume le texte suivant en wolof en maximum 200 caractères (espaces inclus). Le résumé doit être fluide, naturel et compréhensible par un locuteur wolof natif. N'utilise pas de mots français sauf si le terme n'existe pas en wolof. Ne dépasse jamais 200 caractères.\nTexte à résumer :\n${description}`;
    navigator.clipboard.writeText(prompt).then(() => {
      this.editCopySuccess = true;
      setTimeout(() => { this.editCopySuccess = false; }, 2000);
    }).catch(() => {});
  }

  resetForm(): void {
    this.opportuniteForm.reset({
      date: new Date().toISOString().split('T')[0],
      wolofdescr: ''
    });
    this.selectedImage = null;
    this.previewImage = null;
    this.errorMessage = null;
    this.successMessage = null;
  }

  /**
   * Gère le changement de fichier d'image pour l'ajout - VERSION AMÉLIORÉE AVEC 1GB
   */
  onImageSelect(event: any): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validation avancée du fichier avec limite de 1GB
      const validation = this.validateImageFile(file);
      if (!validation.isValid) {
        this.errorMessage = validation.errorMessage!;
        console.error('❌ Validation image échouée:', validation.errorMessage);
        // Réinitialiser l'input
        input.value = '';
        this.selectedImage = null;
        this.previewImage = null;
        return;
      }
      
      // Réinitialiser les erreurs précédentes
      this.errorMessage = null;
      this.selectedImage = file;
      
      console.log(`📁 Image sélectionnée: ${file.name} (${this.formatFileSize(file.size)})`);
      
      // Créer une URL pour prévisualiser l'image
      try {
        const reader = new FileReader();
        reader.onload = () => {
          this.previewImage = reader.result as string;
          console.log('✅ Aperçu de l\'image généré');
        };
        reader.onerror = () => {
          console.error('❌ Erreur FileReader');
          this.errorMessage = 'Erreur lors de la lecture du fichier image.';
          this.selectedImage = null;
          this.previewImage = null;
          input.value = '';
        };
        reader.readAsDataURL(this.selectedImage);
      } catch (error) {
        console.error('❌ Erreur FileReader:', error);
        this.errorMessage = 'Impossible de lire le fichier sélectionné.';
        this.selectedImage = null;
        this.previewImage = null;
        input.value = '';
      }
    }
  }

  /**
   * Valide les données avant l'envoi - VERSION MISE À JOUR AVEC 1GB
   */
  private validateFormData(): string | null {
    const formValue = this.opportuniteForm.value;
    
    if (!formValue.titre || formValue.titre.trim().length < 3) {
      return 'Le titre doit contenir au moins 3 caractères.';
    }
    
    if (!formValue.descr || formValue.descr.trim().length < 10) {
      return 'La description doit contenir au moins 10 caractères.';
    }
    
    if (!formValue.categorie) {
      return 'Veuillez sélectionner une catégorie.';
    }
    
    if (!formValue.lien) {
      return 'Le lien est requis.';
    }
    
    // Revalider le fichier au moment de la soumission avec limite 1GB
    if (this.selectedImage) {
      const validation = this.validateImageFile(this.selectedImage);
      if (!validation.isValid) {
        return validation.errorMessage!;
      }
    }
    
    return null;
  }

  saveOpportunite(): void {
    if (this.opportuniteForm.invalid || this.saveLoading) {
      this.opportuniteForm.markAllAsTouched();
      return;
    }

    // Validation supplémentaire avec gestion 1GB
    const validationError = this.validateFormData();
    if (validationError) {
      this.errorMessage = validationError;
      return;
    }

    this.saveLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formValue = this.opportuniteForm.value;
    const formData = new FormData();

    formData.append('titre', formValue.titre?.trim() || '');
    formData.append('descr', formValue.descr?.trim() || '');
    formData.append('lien', formValue.lien?.trim() || '');
    formData.append('categorie', formValue.categorie || '');
    formData.append('date', formValue.date || new Date().toISOString().split('T')[0]);
    formData.append('idauteur', '1');
    formData.append('wolofdescr', formValue.wolofdescr?.trim() || '');

    if (this.selectedImage) {
      formData.append('file', this.selectedImage, this.selectedImage.name);
    }

    this.opportuniteService.createOpportunite(formData).subscribe({
      next: () => {
        this.saveLoading = false;
        this.showSuccessMessage('Opportunité ajoutée avec succès');
        this.closeAddOpportunitePopup();
        this.loadOpportunites(this.currentPage);
      },
      error: (err) => {
        this.saveLoading = false;
        console.error('❌ Erreur lors de l\'ajout de l\'opportunité:', err);

        let errorMsg = this.handleFormError(err);

        if (err.status === 413 || err.status === 0) {
          errorMsg += ` Essayez de compresser votre image ou utilisez un format plus léger.`;
        }

        this.showErrorMessage(errorMsg);
      }
    });
  }

  // Méthodes pour la gestion du popup de modification
  openEditOpportunitePopup(opportunite: OpportuniteItem): void {
    this.currentEditOpportunite = opportunite;
    this.editCurrentImage = opportunite.img;
    
    // Formater la date pour l'input date
    const dateFormatted = new Date(opportunite.date).toISOString().split('T')[0];
    
    // Remplir le formulaire avec les données existantes
    this.editOpportuniteForm.patchValue({
      titre: opportunite.titre,
      descr: opportunite.descr,
      lien: opportunite.lien || '',
      categorie: opportunite.categorie,
      date: dateFormatted,
      isvalid: opportunite.isvalid,
      alaune: opportunite.alaune,
      wolofdescr: opportunite.wolofdescr || ''
    });
    
    // Réinitialiser les variables d'image
    this.editSelectedImage = null;
    this.editPreviewImage = null;
    this.editErrorMessage = null;
    this.editSuccessMessage = null;
    
    this.showEditPopup = true;
    document.body.style.overflow = 'hidden';
  }

  closeEditOpportunitePopup(): void {
    this.showEditPopup = false;
    this.currentEditOpportunite = null;
    this.editCurrentImage = null;
    this.editSelectedImage = null;
    this.editPreviewImage = null;
    this.editErrorMessage = null;
    this.editSuccessMessage = null;
    this.editOpportuniteForm.reset();
    document.body.style.overflow = '';
  }

  /**
   * Gère le changement de fichier d'image pour la modification - VERSION AMÉLIORÉE AVEC 1GB
   */
  onEditImageSelect(event: any): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validation avancée du fichier avec limite de 1GB
      const validation = this.validateImageFile(file);
      if (!validation.isValid) {
        this.editErrorMessage = validation.errorMessage!;
        console.error('❌ Validation image de modification échouée:', validation.errorMessage);
        // Réinitialiser l'input
        input.value = '';
        this.editSelectedImage = null;
        this.editPreviewImage = null;
        return;
      }
      
      // Réinitialiser les erreurs précédentes
      this.editErrorMessage = null;
      this.editSelectedImage = file;
      
      console.log(`📁 Image de modification sélectionnée: ${file.name} (${this.formatFileSize(file.size)})`);
      
      // Créer une URL pour prévisualiser l'image
      try {
        const reader = new FileReader();
        reader.onload = () => {
          this.editPreviewImage = reader.result as string;
          console.log('✅ Aperçu de l\'image de modification généré');
        };
        reader.onerror = () => {
          console.error('❌ Erreur FileReader pour la modification');
          this.editErrorMessage = 'Erreur lors de la lecture du fichier image.';
          this.editSelectedImage = null;
          this.editPreviewImage = null;
          input.value = '';
        };
        reader.readAsDataURL(this.editSelectedImage);
      } catch (error) {
        console.error('❌ Erreur FileReader pour la modification:', error);
        this.editErrorMessage = 'Impossible de lire le fichier sélectionné.';
        this.editSelectedImage = null;
        this.editPreviewImage = null;
        input.value = '';
      }
    }
  }

  removeEditImage(): void {
    this.editSelectedImage = null;
    this.editPreviewImage = null;
    this.editErrorMessage = null; // Réinitialiser les erreurs
    // Réinitialiser l'input file
    const input = document.getElementById('edit-image') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  /**
   * Valide les données du formulaire de modification - VERSION MISE À JOUR AVEC 1GB
   */
  private validateEditFormData(): string | null {
    const formValue = this.editOpportuniteForm.value;
    
    if (!formValue.titre || formValue.titre.trim().length < 3) {
      return 'Le titre doit contenir au moins 3 caractères.';
    }
    
    if (!formValue.descr || formValue.descr.trim().length < 10) {
      return 'La description doit contenir au moins 10 caractères.';
    }
    
    if (!formValue.categorie) {
      return 'Veuillez sélectionner une catégorie.';
    }
    
    if (!formValue.lien) {
      return 'Le lien est requis.';
    }
    
    // Si une nouvelle image est sélectionnée, la valider avec limite 1GB
    if (this.editSelectedImage) {
      const validation = this.validateImageFile(this.editSelectedImage);
      if (!validation.isValid) {
        return validation.errorMessage!;
      }
    }
    
    return null;
  }

  /**
   * Soumet le formulaire de modification d'opportunité avec préservation de l'image - LIMITE 1GB
   */
  submitEditOpportunite(): void {
    if (!this.currentEditOpportunite || this.editLoading) {
      return;
    }

    if (this.editOpportuniteForm.invalid) {
      this.editOpportuniteForm.markAllAsTouched();
      this.editErrorMessage = 'Veuillez remplir correctement tous les champs obligatoires';
      return;
    }

    // Validation supplémentaire avec gestion 1GB
    const validationError = this.validateEditFormData();
    if (validationError) {
      this.editErrorMessage = validationError;
      return;
    }

    this.editLoading = true;
    this.editErrorMessage = null;
    this.editSuccessMessage = null;

    const formData = new FormData();
    const formValue = this.editOpportuniteForm.value;

    formData.append('titre', formValue.titre?.trim() || '');
    formData.append('descr', formValue.descr?.trim() || '');
    formData.append('lien', formValue.lien?.trim() || '');
    formData.append('categorie', formValue.categorie || '');
    formData.append('date', formValue.date || new Date().toISOString().split('T')[0]);
    formData.append('idauteur', (this.currentEditOpportunite.idauteur || 1).toString());
    formData.append('wolofdescr', formValue.wolofdescr?.trim() || '');

    if (this.editSelectedImage) {
      formData.append('file', this.editSelectedImage, this.editSelectedImage.name);
    }
    
    // Envoyer la requête de modification
    this.opportuniteService.updateOpportunite(this.currentEditOpportunite.id, formData).subscribe({
      next: (updatedOpportunite) => {
        console.log('✅ Opportunité mise à jour avec succès');
        
        // VÉRIFICATION : Si l'image a disparu côté serveur, on la restaure côté client
        if (!updatedOpportunite.img && this.currentEditOpportunite?.img) {
          console.warn('⚠️  L\'image a disparu côté serveur, restauration côté client');
          updatedOpportunite.img = this.currentEditOpportunite.img;
        }
        
        // Mettre à jour l'opportunité dans la liste
        const index = this.opporList.findIndex(o => o.id === this.currentEditOpportunite!.id);
        if (index !== -1) {
          this.opporList[index] = {
            ...updatedOpportunite,
            img: updatedOpportunite.img ? 
              (updatedOpportunite.img.startsWith('http') ? updatedOpportunite.img : `${this.imageBaseUrl}${updatedOpportunite.img}`) : 
              'assets/images/placeholder.jpg',
            auteurimg: updatedOpportunite.auteurimg ? 
              (updatedOpportunite.auteurimg.startsWith('http') ? updatedOpportunite.auteurimg : `${this.imageBaseUrl}${updatedOpportunite.auteurimg}`) : 
              'assets/images/user-placeholder.jpg'
          };
        }
        
        this.editLoading = false;
        this.editSuccessMessage = 'Opportunité modifiée avec succès!';
        
        // Fermer le formulaire après 2 secondes
        setTimeout(() => {
          this.closeEditOpportunitePopup();
        }, 2000);
      },
      error: (err) => {
        this.editLoading = false;
        console.error('❌ ERREUR lors de la modification de l\'opportunité', err);
        
        let errorMsg = this.handleFormError(err);
        
        // Messages spéciaux pour les gros fichiers
        if (err.status === 413 || err.status === 0) {
          errorMsg += ` Essayez de compresser votre image ou utilisez un format plus léger.`;
        }
        
        this.editErrorMessage = errorMsg;
      }
    });
  }

  /**
   * Gestion d'erreur améliorée pour gérer les réponses texte et JSON - AVEC MESSAGES 1GB
   */
  private handleFormError(error: any): string {
    console.error('Erreur complète:', error);
    
    if (error instanceof HttpErrorResponse) {
      console.error('Status:', error.status);
      console.error('Status Text:', error.statusText);
      console.error('Error body:', error.error);
      
      // Gestion spécifique des erreurs HTTP
      switch (error.status) {
        case 200:
          return ''; // Pas d'erreur, c'est un succès
          
        case 400:
          return this.extractErrorMessage(error.error) || 'Données invalides. Veuillez vérifier les champs.';
        case 401:
          return 'Vous n\'êtes pas autorisé à effectuer cette action.';
        case 403:
          return 'Accès refusé. Vérifiez vos permissions.';
        case 404:
          return 'Service non trouvé. Veuillez contacter l\'administrateur.';
        case 413:
          return `Fichier trop volumineux. La limite est de ${this.MAX_FILE_SIZE_TEXT}.`;
        case 422:
          return this.extractErrorMessage(error.error) || 'Données non traitables. Vérifiez le format de vos données.';
        case 500:
          return 'Erreur interne du serveur. Veuillez réessayer plus tard.';
        case 507:
          return 'Espace de stockage insuffisant sur le serveur.';
        case 0:
          return 'Erreur de connexion. Vérifiez votre connexion Internet ou la taille du fichier.';
        default:
          return this.extractErrorMessage(error.error) || `Erreur HTTP ${error.status}: ${error.statusText}`;
      }
    }
    
    // Erreur réseau ou autre
    if (error.name === 'NetworkError' || error.message?.includes('Network')) {
      return 'Erreur de connexion. Vérifiez votre connexion Internet ou réduisez la taille du fichier.';
    }
    
    // Erreur générique
    return error.message || 'Une erreur inattendue s\'est produite.';
  }

  /**
   * Extrait le message d'erreur depuis différents formats de réponse
   */
  private extractErrorMessage(errorBody: any): string | null {
    if (!errorBody) return null;
    
    // Si c'est une string, la retourner directement
    if (typeof errorBody === 'string') {
      return errorBody;
    }
    
    // Si c'est un objet, chercher le message
    if (typeof errorBody === 'object') {
      return errorBody.message || errorBody.error || errorBody.details || null;
    }
    
    return null;
  }

  /**
   * Debug FormData
   */
  private logFormData(formData: FormData): void {
    console.log('=== DONNÉES ENVOYÉES ===');
    formData.forEach((value, key) => {
      if (value instanceof File) {
        console.log(`${key}: [FILE] ${value.name} (${this.formatFileSize(value.size)})`);
      } else {
        console.log(`${key}: ${value}`);
      }
    });
  }

  showSuccessMessage(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  showErrorMessage(message: string): void {
    this.errorMessage = message;
    setTimeout(() => {
      this.errorMessage = null;
    }, 5000);
  }

  // Méthodes pour la pagination
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadOpportunites(page);
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

  goToOpporDetail(id: number): void {
    this.router.navigate(['/opportunites', id]);
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

  // Méthodes pour le popup de description
  openDescriptionPopup(description: string): void {
    this.popupDescription = description;
    this.showPopup = true;
    document.body.style.overflow = 'hidden';
  }

  closeDescriptionPopup(): void {
    this.showPopup = false;
    document.body.style.overflow = '';
  }

  getTruncatedDescription(description: string, maxLength: number = 150): string {
    if (!description) return '';
    
    if (description.length <= maxLength) {
      return description;
    }
    
    const truncated = description.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > maxLength * 0.8) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }
    
    return truncated + '...';
  }

  shouldShowSeeMore(description: string, maxLength: number = 150): boolean {
    if (!description) return false;
    return description.length > maxLength;
  }

  /**
   * Ouvre la confirmation de suppression pour une seule opportunité
   */
  openDeleteConfirm(oppor: OpportuniteItem): void {
    this.opporToDelete = oppor;
    this.deleteMultiple = false;
    this.showDeleteConfirm = true;
    this.deleteError = false;
    this.deleteErrorMessage = '';
    document.body.style.overflow = 'hidden'; // Empêche le défilement
  }

  /**
   * Ferme le popup de confirmation de suppression
   */
  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.opporToDelete = null;
    this.deleteLoading = false;
    this.deleteError = false;
    this.deleteErrorMessage = '';
    this.deleteMultiple = false;
    document.body.style.overflow = ''; // Rétablit le défilement
  }

  /**
   * Confirme et exécute la suppression avec gestion d'erreur améliorée
   */
  confirmDelete(): void {
    this.deleteLoading = true;
    this.deleteError = false;
    this.deleteErrorMessage = '';
    
    if (this.deleteMultiple) {
      // Pour la suppression multiple (à implémenter si nécessaire)
      const selectedOpporIds = this.opporList
        .filter(oppor => oppor.selected)
        .map(oppor => oppor.id);
        
      if (selectedOpporIds.length === 0) {
        this.deleteError = true;
        this.deleteErrorMessage = "Aucune opportunité sélectionnée";
        this.deleteLoading = false;
        return;
      }
      
      // À implémenter : this.opportuniteService.deleteMultipleOppor(selectedOpporIds)
      this.deleteError = true;
      this.deleteErrorMessage = "Suppression multiple non implémentée";
      this.deleteLoading = false;
      
    } else if (this.opporToDelete) {
      // Suppression d'une seule opportunité
      this.opportuniteService.deleteOppor(this.opporToDelete.id).subscribe({
        next: (response) => {
          console.log('✅ Réponse de suppression:', response);
          this.handleDeleteSuccess();
        },
        error: (err) => {
          this.handleDeleteError(err);
        }
      });
    }
  }

  /**
   * Gère les erreurs de suppression avec gestion spéciale pour les réponses texte
   */
  private handleDeleteError(error: any): void {
    console.error('❌ Erreur lors de la suppression:', error);
    
    // Cas spécial : Si le statut est 200, c'est un succès même si ok = false
    if (error instanceof HttpErrorResponse && error.status === 200) {
      console.log('✅ Suppression réussie (statut 200 détecté)');
      this.handleDeleteSuccess();
      return;
    }
    
    // Sinon, traiter comme une vraie erreur
    this.deleteError = true;
    const errorMessage = this.handleFormError(error);
    this.deleteErrorMessage = errorMessage || 'Erreur lors de la suppression';
    this.deleteLoading = false;
  }

  /**
   * Gère le succès de la suppression
   */
  private handleDeleteSuccess(): void {
    if (this.opporToDelete) {
      // Supprimer de la liste complète
      this.opporList = this.opporList.filter(oppor => oppor.id !== this.opporToDelete!.id);
      
      // Recalculer la pagination
      this.totalItems = this.opporList.length;
      this.totalPages = Math.ceil(this.totalItems / this.pageSize);
      
      // Vérifier si la page actuelle est toujours valide
      if (this.currentPage >= this.totalPages && this.totalPages > 0) {
        this.currentPage = this.totalPages - 1;
      }
      
      // Appliquer la nouvelle pagination
      this.applyPagination();
    }
    
    // Fermer le popup et réinitialiser
    this.closeDeleteConfirm();
  }

  /**
   * Applique la pagination côté client
   */
  applyPagination(): void {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.opporList = this.opporList.slice(startIndex, endIndex);
  }
}