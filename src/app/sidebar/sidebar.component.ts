import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../service/auth.service';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  requiredRoles?: string[];
  requiredLevel?: number;
  isVisible?: boolean;
  isDisabled?: boolean;
  hasDropdown?: boolean;
  dropdownItems?: DropdownItem[];
}

interface DropdownItem {
  path: string;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  private subscriptions: Subscription = new Subscription();
  
  // État du dropdown pour les paramètres
  isSettingsDropdownOpen = false;
  
  // Menu items avec leurs permissions
  menuItems: MenuItem[] = [
    { 
      path: '/dashboard', 
      label: 'Tableau de bord', 
      icon: 'dashboard',
      requiredLevel: 0
    },
    { 
      path: '/utilisateurs', 
      label: 'Utilisateurs', 
      icon: 'users',
      requiredRoles: ['ADMIN','SUPER_ADMINISTRATOR', 'MAIN_ADMINISTRATOR'],
      requiredLevel: 4
    },
    { 
      path: '/campagne', 
      label: 'Campagnes', 
      icon: 'campaigns',
      requiredRoles: ['ADMIN','SUPER_ADMINISTRATOR', 'MAIN_ADMINISTRATOR', 'TREASURER',],
      requiredLevel: 2
    },
    { 
      path: '/actu', 
      label: 'Actualités', 
      icon: 'news',
      requiredRoles: ['ADMIN','SUPER_ADMINISTRATOR', 'MAIN_ADMINISTRATOR', 'CONTENT_ADMINISTRATOR', 'ADMIN'],
      requiredLevel: 3
    },
    { 
      path: '/parametres', 
      label: 'Paramètres', 
      icon: 'settings',
      requiredRoles: ['ADMIN','SUPER_ADMINISTRATOR', 'MAIN_ADMINISTRATOR'],
      requiredLevel: 4,
      hasDropdown: true,
      dropdownItems: [
        { path: '/categories', label: 'Catégories', icon: 'category' },
        { path: '/regions', label: 'Régions', icon: 'location' },
        { path: '/departements', label: 'Départements', icon: 'map' }
      ]
    },
    { 
      path: '/oppor', 
      label: 'Opportunités', 
      icon: 'opportunities',
      requiredRoles: ['ADMIN','SUPER_ADMINISTRATOR', 'MAIN_ADMINISTRATOR', 'CONTENT_ADMINISTRATOR'],
      requiredLevel: 3
    },
    { 
      path: '/full-video', 
      label: 'Vidéos', 
      icon: 'videos',
      requiredRoles: ['ADMIN','SUPER_ADMINISTRATOR', 'MAIN_ADMINISTRATOR', 'CONTENT_ADMINISTRATOR'],
      requiredLevel: 3
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => {
        console.log('Utilisateur reçu dans sidebar:', user);
        this.currentUser = user;
        this.updateMenuPermissions();
      })
    );

    this.currentUser = this.authService.getCurrentUser();
    console.log('Utilisateur actuel au démarrage:', this.currentUser);
    this.updateMenuPermissions();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Toggle le dropdown des paramètres
   */
  toggleSettingsDropdown(): void {
    this.isSettingsDropdownOpen = !this.isSettingsDropdownOpen;
  }

  /**
   * Ferme le dropdown des paramètres
   */
  closeSettingsDropdown(): void {
    this.isSettingsDropdownOpen = false;
  }

  /**
   * Navigation vers un item du dropdown
   */
  navigateToDropdownItem(path: string): void {
    this.router.navigate([path]);
    this.closeSettingsDropdown();
  }

  private updateMenuPermissions(): void {
    if (!this.currentUser) {
      this.menuItems.forEach(item => {
        item.isVisible = item.path === '/dashboard';
        item.isDisabled = item.path !== '/dashboard';
      });
      return;
    }

    const userRole = this.currentUser.role?.toUpperCase();
    const userLevel = this.getUserLevel(userRole);

    console.log('Rôle utilisateur:', userRole, 'Niveau:', userLevel);

    this.menuItems.forEach(item => {
      const hasPermission = this.checkPermission(item, userRole, userLevel);
      item.isVisible = hasPermission;
      item.isDisabled = !hasPermission;
    });
  }

  private checkPermission(item: MenuItem, userRole?: string, userLevel?: number): boolean {
    if (item.path === '/dashboard') {
      return true;
    }

    if (!userRole || userLevel === undefined) {
      return false;
    }

    if (item.requiredLevel !== undefined && userLevel < item.requiredLevel) {
      return false;
    }

    if (item.requiredRoles && item.requiredRoles.length > 0) {
      return item.requiredRoles.includes(userRole);
    }

    return true;
  }

  private getUserLevel(role?: string): number {
    if (!role) return 0;

    const roleLevels: { [key: string]: number } = {
      'SUPER_ADMINISTRATOR': 5,
      'MAIN_ADMINISTRATOR': 4,
      'CONTENT_ADMINISTRATOR': 3,
      'ADMIN': 5,
      'TREASURER': 2,
      'MODERATOR': 2,
      'ASSISTANT': 1,
      'USER': 0
    };

    return roleLevels[role] || 0;
  }

  getUserRoleDisplay(): string {
    console.log('getCurrentUser dans getUserRoleDisplay:', this.currentUser);
    
    if (!this.currentUser?.role) {
      console.log('Pas de rôle trouvé, retour Utilisateur');
      return 'Utilisateur';
    }

    const roleDisplayNames: { [key: string]: string } = {
      'SUPER_ADMINISTRATOR': 'Super Administrateur',
      'MAIN_ADMINISTRATOR': 'Administrateur Principal',
      'CONTENT_ADMINISTRATOR': 'Administrateur Contenu',
      'ADMIN': 'Administrateur',
      'TREASURER': 'Trésorier',
      'MODERATOR': 'Modérateur',
      'ASSISTANT': 'Assistante',
      'USER': 'Utilisateur'
    };

    const roleKey = this.currentUser.role.toUpperCase();
    const displayName = roleDisplayNames[roleKey] || 'Utilisateur';
    
    console.log('Rôle:', roleKey, 'Nom affiché:', displayName);
    return displayName;
  }

  getUserDisplayName(): string {
    if (!this.currentUser) return 'Utilisateur';
    
    if (this.currentUser.firstname || this.currentUser.secondname) {
      return `${this.currentUser.firstname || ''} ${this.currentUser.secondname || ''}`.trim();
    }
    
    return this.currentUser.email || this.currentUser.username || 'Utilisateur';
  }
  getDisplayImg(): string {
    if (!this.currentUser?.img) {
      return 'https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg'; // Image par défaut
    }
    
    // Concaténer l'URL de base avec le nom de l'image
    const baseUrl = 'http://peeyconnect.net/repertoire_upload/';
    return `${baseUrl}${this.currentUser.img}`;
  }
  
  // Méthode pour gérer l'erreur de chargement d'image
  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    target.src = 'assets/images/default-profile.png';
  }

  isActive(path: string): boolean {
    return this.router.url.includes(path);
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  logout(): void {
    this.authService.logout();
  }

  navigateTo(path: string): void {
    const menuItem = this.menuItems.find(item => item.path === path);
    if (menuItem && !menuItem.isDisabled) {
      this.router.navigate([path]);
    }
  }

  getMenuItem(path: string): MenuItem | undefined {
    return this.menuItems.find(item => item.path === path);
  }

  isMenuVisible(path: string): boolean {
    const item = this.getMenuItem(path);
    return item?.isVisible || false;
  }

  isMenuDisabled(path: string): boolean {
    const item = this.getMenuItem(path);
    return item?.isDisabled || false;
  }
}