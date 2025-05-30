import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { UserService } from '../service/user.service';

// Interface User pour typer correctement
export interface User {
  id: number;
  firstname: string;
  secondname: string;
  email: string;
  telephone?: string;
  profession?: string;
  role: string;
  selected: boolean;
  sexe?: string;
  activated?: boolean;
  annee?: string;
  commune?: string;
  departement?: string;
  fb?: string;
  localiteResidence?: string;
  region?: string;
  niveau?: string;
  parentid?: string;
  pere?: string;
  mere?: string;
  linkdin?: string;
  x?: string;
}

// Interface pour la création d'un nouvel utilisateur
export interface NewUser {
  firstname: string;
  secondname: string;
  email: string;
  password: string;
  annee?: string;
  activated: boolean;
  centreinteret?: { id: number, libelle: string }[];
  commune?: string;
  departement?: string;
  fb?: string;
  img?: string;
  linkdin?: string;
  localiteResidence?: string;
  mere?: string;
  niveau?: string;
  parentid?: string;
  pere?: string;
  profession?: string;
  region?: string;
  sexe?: string;
  telephone?: string;
  x?: string;
  role: string;
}

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
  createUserForm: FormGroup;
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

  constructor(
    private userService: UserService,
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
      role: ['user', [Validators.required]],
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
      telephone: [''],
      profession: [''],
      role: ['user', [Validators.required]],
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
      case 'admin': return 'status-admin';
      case 'manager': return 'status-manager';
      case 'user': return 'status-user';
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
      case 'admin': return 'status-dot-admin';
      case 'manager': return 'status-dot-manager';
      case 'user': return 'status-dot-user';
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
      role: 'user',
      activated: true
    });
    this.activeTab = 'info';
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

    const newUser: NewUser = {
      ...this.createUserForm.value,
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

  // Méthodes pour l'édition d'utilisateur
  openEditModal(user: User): void {
    this.userToEdit = user;
    this.showEditModal = true;
    this.resetEditModalState();
    
    this.editUserForm.patchValue({
      id: user.id,
      firstname: user.firstname,
      secondname: user.secondname,
      email: user.email,
      telephone: user.telephone || '',
      profession: user.profession || '',
      role: user.role,
      sexe: user.sexe || '',
      activated: user.activated || true,
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
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.userToEdit = null;
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
  
  submitEditUser(): void {
    if (this.editUserForm.invalid) {
      this.markFormGroupTouched(this.editUserForm);
      return;
    }

    this.editLoading = true;
    const userData = this.editUserForm.value;

    this.userService.updateUser(userData.id, userData).subscribe({
      next: (updatedUser) => {
        this.handleEditSuccess(updatedUser);
      },
      error: (err) => {
        this.handleEditError(err);
      }
    });
  }

  handleEditSuccess(updatedUser: User): void {
    this.editLoading = false;
    this.editSuccess = true;
    
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

// le html 