import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { UserService, User, NewUser, UpdateUser } from '../service/user.service';
import { RegionService, Region, Departement } from '../service/region.service';

@Component({
  selector: 'app-utilisateur',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SidebarComponent
  ],
  templateUrl: './utilisateur.component.html',
  styleUrls: ['./utilisateur.component.css']
})
export class UtilisateurComponent implements OnInit {
    // Utilisateurs
    allUsers: User[] = [];
    displayedUsers: User[] = [];
    filteredUsers: User[] = [];
    
    // Pagination
    currentPage = 1;
    itemsPerPage = 10;
    totalUsers = 0;
    totalPages = 1;
    startIndex = 1;
    endIndex = 10;
    
    // Filtres
    searchTerm = '';
    roleFilter = 'all';
    
    // Sélection
    selectAll = false;
    
    // État de chargement
    loading = false;
    error: string | null = null;
    
    // Modal de confirmation de suppression
    showDeleteConfirmModal = false;
    userToDelete: User | null = null;
    deleteMultiple = false;
    deleteLoading = false;
    deleteSuccess = false;
    deleteError = false;
    deleteErrorMessage: string | null = null;

    // Modal de création d'utilisateur
    showCreateUserModal = false;
    createUserForm!: FormGroup;
    createLoading = false;
    createSuccess = false;
    createError = false;
    createErrorMessage: string | null = null;
    activeTab = 'info';

    // Modal d'édition d'utilisateur
    showEditModal = false;
    userToEdit: User | null = null;
    editUserForm: FormGroup;
    editLoading = false;
    editSuccess = false;
    editError = false;
    editErrorMessage: string | null = null;

    // Gestion des régions et départements
    regions: Region[] = [];
    departements: Departement[] = [];
    selectedRegionId: number | null = null;
    selectedDepartementId: number | null = null;
    loadingRegions = false;
    loadingDepartements = false;
    regionError: string | null = null;
    departementError: string | null = null;

    // Pour l'édition - régions et départements
    editRegions: Region[] = [];
    editDepartements: Departement[] = [];
    editSelectedRegionId: number | null = null;
    editSelectedDepartementId: number | null = null;
    editLoadingRegions = false;
    editLoadingDepartements = false;
    editRegionError: string | null = null;
    editDepartementError: string | null = null;

    // Option pour changer le mot de passe lors de l'édition
    changePassword = false;

  // 1. CORRECTION DU CONSTRUCTEUR
constructor(
  private userService: UserService,
  private regionService: RegionService,
  private fb: FormBuilder
) {
  // Formulaire de création
  this.createUserForm = this.fb.group({
    firstname: ['', [Validators.required]],
    secondname: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    telephone: [''],
    profession: [''],
    role: ['USER', [Validators.required]],
    sexe: [''],
    activated: [true],
    annee: [''],
    commune: [''],
    departement: [''],
    fb: [''],
    localiteResidence: [''],
    region: [''],
    niveau: [''],
    parentid: [''],
    pere: [''],
    mere: [''],
    linkdin: [''],
    x: ['']
  });

  // Formulaire d'édition
  this.editUserForm = this.fb.group({
    id: [''],
    firstname: ['', [Validators.required]],
    secondname: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: [''], // Pas de validateur par défaut
    telephone: [''],
    profession: [''],
    role: ['USER', [Validators.required]],
    sexe: [''],
    activated: [true],
    annee: [''],
    commune: [''],
    departement: [''],
    fb: [''],
    localiteResidence: [''],
    region: [''],
    niveau: [''],
    parentid: [''],
    pere: [''],
    mere: [''],
    linkdin: [''],
    x: ['']
  });
}

    ngOnInit(): void {
      this.loadUsers();
      this.loadRegions();
    }

    // Chargement des régions
    loadRegions(): void {
      this.loadingRegions = true;
      this.regionError = null;
      
      this.regionService.getRegions().subscribe({
        next: (regions) => {
          this.regions = regions;
          this.editRegions = [...regions]; // Copie pour l'édition
          this.loadingRegions = false;
        },
        error: (err) => {
          this.regionError = 'Impossible de charger les régions';
          this.loadingRegions = false;
          console.error('Erreur lors du chargement des régions:', err);
        }
      });
    }

    // Chargement des départements d'une région pour la création
    onRegionChange(event: Event): void {
      const selectElement = event.target as HTMLSelectElement;
      const regionId = selectElement.value ? Number(selectElement.value) : null;
      
      this.selectedRegionId = regionId;
      this.departements = [];
      
      this.createUserForm.patchValue({
        departement: ''
      });
      
      if (regionId) {
        this.loadingDepartements = true;
        this.departementError = null;
        
        this.regionService.getDepartementsByRegion(regionId).subscribe({
          next: (departements) => {
            this.departements = departements;
            this.loadingDepartements = false;
          },
          error: (err) => {
            this.departementError = 'Impossible de charger les départements';
            this.loadingDepartements = false;
            console.error('Erreur lors du chargement des départements:', err);
          }
        });
      }
    }

    // Chargement des départements d'une région pour l'édition
    // onEditRegionChange(regionId: number): void {
    //   this.editSelectedRegionId = regionId;
    //   this.editSelectedDepartementId = null;
    //   this.editDepartements = [];
      
    //   // Mettre à jour le formulaire
    //   this.editUserForm.patchValue({
    //     region: regionId?.toString() || '',
    //     departement: ''
    //   });
      
    //   if (regionId) {
    //     this.editLoadingDepartements = true;
    //     this.editDepartementError = null;
        
    //     this.regionService.getDepartementsByRegion(regionId).subscribe({
    //       next: (departements) => {
    //         this.editDepartements = departements;
    //         this.editLoadingDepartements = false;
    //       },
    //       error: (err) => {
    //         this.editDepartementError = 'Impossible de charger les départements';
    //         this.editLoadingDepartements = false;
    //         console.error('Erreur lors du chargement des départements:', err);
    //       }
    //     });
    //   }
    // }

    // Sélection d'un département pour la création
    onDepartementChange(departementId: number): void {
      this.selectedDepartementId = departementId;
    }

    // Sélection d'un département pour l'édition
    onEditDepartementChange(departementId: number): void {
      this.editSelectedDepartementId = departementId;
      this.editUserForm.patchValue({
        departement: departementId?.toString() || ''
      });
    }

   // 2. CORRECTION DE LA MÉTHODE TOGGLE CHANGE PASSWORD
toggleChangePassword(): void {
  this.changePassword = !this.changePassword;
  
  const passwordControl = this.editUserForm.get('password');
  if (passwordControl) {
    if (this.changePassword) {
      passwordControl.setValidators([Validators.required, Validators.minLength(6)]);
      passwordControl.setValue(''); // Vider le champ pour forcer la saisie
    } else {
      passwordControl.clearValidators();
      passwordControl.setValue('');
    }
    passwordControl.updateValueAndValidity();
  }
}

    // Méthodes utilitaires pour obtenir les noms
    getRegionName(regionCode: string): string {
      const region = this.regions.find(r => r.code === regionCode || r.id?.toString() === regionCode);
      return region ? region.libelle : regionCode;
    }

    getDepartementName(departementCode: string): string {
      const departement = this.departements.find(d => d.code === departementCode || d.id?.toString() === departementCode);
      return departement ? departement.libelle : departementCode;
    }

    loadUsers(): void {
      this.loading = true;
      this.error = null;
      
      this.userService.getAllUsers().subscribe({
        next: (users) => {
          this.allUsers = users.map(user => ({ 
            ...user, 
            selected: user.selected === undefined ? false : Boolean(user.selected) 
          }));
          this.filteredUsers = [...this.allUsers];
          this.totalUsers = this.filteredUsers.length;
          this.totalPages = Math.ceil(this.totalUsers / this.itemsPerPage);
          this.updateDisplayedUsers();
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Impossible de charger les utilisateurs. Vérifiez votre connexion ou réessayez plus tard.';
          this.loading = false;
          console.error('Erreur:', err);
        }
      });
    }

    updateDisplayedUsers(): void {
      const startIdx = (this.currentPage - 1) * this.itemsPerPage;
      const endIdx = Math.min(startIdx + this.itemsPerPage, this.filteredUsers.length);
      
      this.displayedUsers = this.filteredUsers.slice(startIdx, endIdx);
      this.startIndex = this.totalUsers === 0 ? 0 : startIdx + 1;
      this.endIndex = endIdx;
    }

    goToPage(page: number): void {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        this.updateDisplayedUsers();
      }
    }

    goToPreviousPage(): void {
      if (this.currentPage > 1) {
        this.goToPage(this.currentPage - 1);
      }
    }

    goToNextPage(): void {
      if (this.currentPage < this.totalPages) {
        this.goToPage(this.currentPage + 1);
      }
    }

    getPageNumbers(): number[] {
      const pages: number[] = [];
      const maxVisiblePages = 5;
      
      if (this.totalPages <= maxVisiblePages) {
        for (let i = 1; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = startPage + maxVisiblePages - 1;
        
        if (endPage > this.totalPages) {
          endPage = this.totalPages;
          startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
          pages.push(i);
        }
      }
      
      return pages;
    }

    /**
 * Soumettre les modifications d'un utilisateur
 */
submitEditUser(): void {
  if (this.editUserForm.invalid) {
    this.markFormGroupTouched(this.editUserForm);
    return;
  }

  if (!this.userToEdit) {
    this.editError = true;
    this.editErrorMessage = "Aucun utilisateur sélectionné pour la modification";
    return;
  }

  this.editLoading = true;
  this.editError = false;
  this.editErrorMessage = null;

  const formData = this.editUserForm.value;
  
  // Préparer les données pour la mise à jour
  const updateData: UpdateUser = {
    firstname: formData.firstname,
    secondname: formData.secondname,
    email: formData.email,
    telephone: formData.telephone || '',
    profession: formData.profession || '',
    role: formData.role,
    sexe: formData.sexe || '',
    activated: formData.activated !== undefined ? formData.activated : true,
    annee: formData.annee || '',
    commune: formData.commune || '',
    departement: this.editSelectedDepartementId?.toString() || formData.departement || '',
    fb: formData.fb || '',
    localiteResidence: formData.localiteResidence || '',
    region: this.editSelectedRegionId?.toString() || formData.region || '',
    niveau: formData.niveau || '',
    parentid: formData.parentid || '',
    pere: formData.pere || '',
    mere: formData.mere || '',
    linkdin: formData.linkdin || '',
    x: formData.x || '',
    centreinteret: [] // Vous pouvez adapter selon vos besoins
  };

  // Ajouter le mot de passe seulement si l'utilisateur souhaite le changer
  if (this.changePassword && formData.password) {
    updateData.password = formData.password;
  }

  // Appeler le service pour mettre à jour l'utilisateur
  this.userService.updateUser(this.userToEdit.id, updateData).subscribe({
    next: (updatedUser) => {
      this.handleEditSuccess(updatedUser);
    },
    error: (err) => {
      this.handleEditError(err);
    }
  });
}

    searchUsers(): void {
      const term = this.searchTerm.toLowerCase().trim();
      
      if (!term && this.roleFilter === 'all') {
        this.filteredUsers = [...this.allUsers];
      } else {
        this.filteredUsers = this.allUsers.filter(user => {
          const matchesSearch = !term || 
            user.firstname.toLowerCase().includes(term) ||
            user.secondname.toLowerCase().includes(term) ||
            user.email.toLowerCase().includes(term) ||
            (user.telephone && user.telephone.toLowerCase().includes(term)) ||
            (user.profession && user.profession.toLowerCase().includes(term));
          
          const matchesRole = this.roleFilter === 'all' || user.role === this.roleFilter;
          
          return matchesSearch && matchesRole;
        });
      }
      
      this.totalUsers = this.filteredUsers.length;
      this.totalPages = Math.ceil(this.totalUsers / this.itemsPerPage);
      this.currentPage = 1;
      this.updateDisplayedUsers();
    }

    filterByRole(role: string): void {
      this.roleFilter = role;
      this.searchUsers();
    }

    toggleSelectAll(): void {
      this.selectAll = !this.selectAll;
      this.allUsers = this.allUsers.map(user => ({ ...user, selected: this.selectAll }));
      this.filteredUsers = this.filteredUsers.map(user => ({ ...user, selected: this.selectAll }));
      this.updateDisplayedUsers();
    }

    toggleUserSelection(user: User): void {
      user.selected = !user.selected;
      this.selectAll = this.allUsers.length > 0 && this.allUsers.every(u => u.selected);
    }

    getRoleName(role: string): string {
      switch (role) {
        case 'SUPER_ADMINISTRATOR': return 'Super Administrateur';
        case 'MAIN_ADMINISTRATOR': return 'Administrateur Principal';
        case 'CONTENT_ADMINISTRATOR': return 'Administrateur Contenu';
        case 'ADMIN': return 'Administrateur';
        case 'TREASURER': return 'Trésorier';
        case 'MODERATOR': return 'Modérateur';
        case 'ASSISTANT': return 'Assistante';
        case 'USER': return 'Utilisateur';
        default: return role;
      }
    }

    getStatusColor(role: string): string {
      switch (role) {
        case 'ADMIN': return 'status-admin';
        case 'MODERATOR': return 'status-manager';
        case 'USER': return 'status-user';
        default: return '';
      }
    }

    getSelectedUsersCount(): number {
      return this.allUsers.filter(u => u.selected).length;
    }
    
    hasSelectedUsers(): boolean {
      return this.allUsers && this.allUsers.length > 0 && this.allUsers.some(user => user.selected === true);
    }

    getStatusDot(role: string): string {
      switch (role) {
        case 'ADMIN': return 'status-dot-admin';
        case 'MODERATOR': return 'status-dot-manager';
        case 'USER': return 'status-dot-user';
        default: return '';
      }
    }

    openDeleteConfirmation(user: User): void {
      this.userToDelete = user;
      this.deleteMultiple = false;
      this.showDeleteConfirmModal = true;
      this.resetDeleteModalState();
    }

    openDeleteMultipleConfirmation(): void {
      this.userToDelete = null;
      this.deleteMultiple = true;
      this.showDeleteConfirmModal = true;
      this.resetDeleteModalState();
    }

    closeDeleteConfirmation(): void {
      this.showDeleteConfirmModal = false;
      this.userToDelete = null;
    }

    resetDeleteModalState(): void {
      this.deleteLoading = false;
      this.deleteSuccess = false;
      this.deleteError = false;
      this.deleteErrorMessage = null;
    }

    confirmDelete(): void {
      this.deleteLoading = true;
      
      if (this.deleteMultiple) {
        const selectedUserIds = this.allUsers
          .filter(user => user.selected)
          .map(user => user.id);
        
        if (selectedUserIds.length === 0) {
          this.deleteError = true;
          this.deleteErrorMessage = "Aucun utilisateur sélectionné";
          this.deleteLoading = false;
          return;
        }
        
        this.userService.deleteMultipleUsers(selectedUserIds).subscribe({
          next: () => {
            this.handleDeleteSuccess();
          },
          error: (err) => {
            this.handleDeleteError(err);
          }
        });
      } else if (this.userToDelete) {
        this.userService.deleteUser(this.userToDelete.id).subscribe({
          next: () => {
            this.handleDeleteSuccess();
          },
          error: (err) => {
            this.handleDeleteError(err);
          }
        });
      }
    }

    handleDeleteSuccess(): void {
      this.deleteLoading = false;
      this.deleteSuccess = true;
      
      setTimeout(() => {
        if (this.deleteMultiple) {
          this.allUsers = this.allUsers.filter(user => !user.selected);
        } else if (this.userToDelete) {
          this.allUsers = this.allUsers.filter(user => user.id !== this.userToDelete?.id);
        }
        
        this.filteredUsers = this.filteredUsers.filter(user => 
          this.allUsers.some(u => u.id === user.id)
        );
        
        this.totalUsers = this.filteredUsers.length;
        this.totalPages = Math.ceil(this.totalUsers / this.itemsPerPage);
        
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
          this.currentPage = this.totalPages;
        }
        
        this.updateDisplayedUsers();
        this.selectAll = false;
        
        setTimeout(() => {
          this.closeDeleteConfirmation();
        }, 1500);
      }, 1000);
    }

    handleDeleteError(err: any): void {
      this.deleteLoading = false;
      this.deleteError = true;
      this.deleteErrorMessage = err.message || "Une erreur est survenue lors de la suppression";
    }

    getFullName(user: User): string {
      return `${user.firstname} ${user.secondname}`;
    }

    // Méthodes pour la création d'utilisateur
    openCreateUserModal(): void {
      this.showCreateUserModal = true;
      this.resetCreateModalState();
      this.createUserForm.reset({
        role: 'USER',
        activated: true
      });
      this.activeTab = 'info';
      
      // Reset région/département pour la création
      this.selectedRegionId = null;
      this.selectedDepartementId = null;
      this.departements = [];
    }

    closeCreateUserModal(): void {
      this.showCreateUserModal = false;
    }

    resetCreateModalState(): void {
      this.createLoading = false;
      this.createSuccess = false;
      this.createError = false;
      this.createErrorMessage = null;
    }

    setActiveTab(tab: string): void {
      this.activeTab = tab;
    }

    submitCreateUser(): void {
      if (this.createUserForm.invalid) {
        this.markFormGroupTouched(this.createUserForm);
        return;
      }

      this.createLoading = true;

      const formData = this.createUserForm.value;
      const newUser: NewUser = {
        ...formData,
        region: this.selectedRegionId?.toString() || formData.region,
        departement: this.selectedDepartementId?.toString() || formData.departement,
        centreinteret: []
      };

      this.userService.createUser(newUser).subscribe({
        next: (response) => {
          this.handleCreateSuccess(response);
        },
        error: (err) => {
          this.handleCreateError(err);
        }
      });
    }

    handleCreateSuccess(response: any): void {
      this.createLoading = false;
      this.createSuccess = true;
      
      setTimeout(() => {
        if (response && response.id) {
          const newUser: User = {
            ...response,
            selected: false
          };
          
          this.allUsers = [newUser, ...this.allUsers];
          this.searchUsers();
        } else {
          this.loadUsers();
        }
        
        setTimeout(() => {
          this.closeCreateUserModal();
        }, 1500);
      }, 1000);
    }

    handleCreateError(err: any): void {
      this.createLoading = false;
      this.createError = true;
      this.createErrorMessage = err.error?.message || err.message || "Une erreur est survenue lors de la création de l'utilisateur";
    }

 
// Nouvelle méthode pour gérer le changement de région dans le modal d'édition
onEditRegionSelectChange(event: Event): void {
  const selectElement = event.target as HTMLSelectElement;
  const regionId = selectElement.value ? Number(selectElement.value) : null;
  
  this.editSelectedRegionId = regionId;
  this.editSelectedDepartementId = null;
  this.editDepartements = [];
  
  // Mettre à jour le formulaire
  this.editUserForm.patchValue({
    region: regionId?.toString() || '',
    departement: ''
  });
  
  if (regionId) {
    this.editLoadingDepartements = true;
    this.editDepartementError = null;
    
    this.regionService.getDepartementsByRegion(regionId).subscribe({
      next: (departements) => {
        this.editDepartements = departements;
        this.editLoadingDepartements = false;
      },
      error: (err) => {
        this.editDepartementError = 'Impossible de charger les départements';
        this.editLoadingDepartements = false;
        console.error('Erreur lors du chargement des départements:', err);
      }
    });
  }
}

// Nouvelle méthode pour gérer le changement de département dans le modal d'édition
onEditDepartementSelectChange(event: Event): void {
  const selectElement = event.target as HTMLSelectElement;
  const departementId = selectElement.value ? Number(selectElement.value) : null;
  
  this.editSelectedDepartementId = departementId;
  this.editUserForm.patchValue({
    departement: departementId?.toString() || ''
  });
}

// 4. CORRECTION DE LA MÉTHODE OPEN EDIT MODAL
openEditModal(user: User): void {
  this.userToEdit = user;
  this.showEditModal = true;
  this.resetEditModalState();
  this.changePassword = false;
  this.activeTab = 'info'; // Assurer qu'on commence par le bon onglet
  
  // Remplir le formulaire avec les données de l'utilisateur
  this.editUserForm.patchValue({
    id: user.id,
    firstname: user.firstname,
    secondname: user.secondname,
    email: user.email,
    password: '', // Toujours vide au début
    telephone: user.telephone || '',
    profession: user.profession || '',
    role: user.role || 'USER',
    sexe: user.sexe || '',
    activated: user.activated !== undefined ? user.activated : true,
    annee: user.annee || '',
    commune: user.commune || '',
    departement: user.departement || '',
    fb: user.fb || '',
    localiteResidence: user.localiteResidence || '',
    region: user.region || '',
    niveau: user.niveau || '',
    parentid: user.parentid || '',
    pere: user.pere || '',
    mere: user.mere || '',
    linkdin: user.linkdin || '',
    x: user.x || ''
  });

  // Nettoyer la validation du mot de passe au début
  const passwordControl = this.editUserForm.get('password');
  if (passwordControl) {
    passwordControl.clearValidators();
    passwordControl.updateValueAndValidity();
  }

  // Gérer la région et le département pour l'édition
  this.handleRegionAndDepartmentForEdit(user);
}
// 5. NOUVELLE MÉTHODE POUR GÉRER RÉGION ET DÉPARTEMENT
private handleRegionAndDepartmentForEdit(user: User): void {
  if (user.region) {
    // Chercher la région par ID ou code
    const regionFound = this.editRegions.find(r => 
      r.id?.toString() === user.region || r.code === user.region || r.libelle === user.region
    );
    
    if (regionFound && regionFound.id) {
      this.editSelectedRegionId = regionFound.id;
      
      // Charger les départements de cette région
      this.editLoadingDepartements = true;
      this.editDepartementError = null;
      
      this.regionService.getDepartementsByRegion(regionFound.id).subscribe({
        next: (departements) => {
          this.editDepartements = departements;
          this.editLoadingDepartements = false;
          
          // Une fois les départements chargés, chercher le département de l'utilisateur
          if (user.departement) {
            const departementFound = departements.find(d => 
              d.id?.toString() === user.departement || 
              d.code === user.departement || 
              d.libelle === user.departement
            );
            
            if (departementFound && departementFound.id) {
              this.editSelectedDepartementId = departementFound.id;
              this.editUserForm.patchValue({
                departement: departementFound.id.toString()
              });
            }
          }
        },
        error: (err) => {
          this.editDepartementError = 'Impossible de charger les départements';
          this.editLoadingDepartements = false;
          console.error('Erreur lors du chargement des départements:', err);
        }
      });
    }
  } else {
    // Reset si pas de région
    this.editSelectedRegionId = null;
    this.editSelectedDepartementId = null;
    this.editDepartements = [];
  }
}





    closeEditModal(): void {
      this.showEditModal = false;
      this.userToEdit = null;
      this.changePassword = false;
      this.editSelectedRegionId = null;
      this.editSelectedDepartementId = null;
      this.editDepartements = [];
    }

    resetEditModalState(): void {
      this.editLoading = false;
      this.editSuccess = false;
      this.editError = false;
      this.editErrorMessage = null;
    }

    availableRoles: string[] = [
      'SUPER_ADMINISTRATOR',
      'MAIN_ADMINISTRATOR',
      'CONTENT_ADMINISTRATOR',
      'ADMIN',
      'TREASURER',
      'MODERATOR',
      'ASSISTANT',
      'USER'
    ];
    
  
// 6. AMÉLIORATION DE LA MÉTHODE HANDLE EDIT SUCCESS
handleEditSuccess(updatedUser: User): void {
  this.editLoading = false;
  this.editSuccess = true;
  
  // Mettre à jour les listes d'utilisateurs avec TOUTES les données
  this.allUsers = this.allUsers.map(user => 
    user.id === updatedUser.id ? { ...updatedUser, selected: user.selected } : user
  );
  
  this.filteredUsers = this.filteredUsers.map(user => 
    user.id === updatedUser.id ? { ...updatedUser, selected: user.selected } : user
  );
  
  this.updateDisplayedUsers();
  
  setTimeout(() => {
    this.closeEditModal();
  }, 1500);
}

    handleEditError(err: any): void {
      this.editLoading = false;
      this.editError = true;
      this.editErrorMessage = err.error?.message || err.message || "Une erreur est survenue lors de la mise à jour de l'utilisateur";
    }

    // Méthodes utilitaires
    markFormGroupTouched(formGroup: FormGroup) {
      Object.values(formGroup.controls).forEach(control => {
        control.markAsTouched();
        
        if (control instanceof FormGroup) {
          this.markFormGroupTouched(control);
        }
      });
    }

    isFieldInvalid(fieldName: string, formGroup: FormGroup = this.createUserForm): boolean {
      const field = formGroup.get(fieldName);
      return field ? field.invalid && (field.dirty || field.touched) : false;
    }
  }

