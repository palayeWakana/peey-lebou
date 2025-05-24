import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../service/auth.service'; // Utiliser votre AuthService

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  requiredRoles?: string[];
  requiredLevel?: number;
  isVisible?: boolean;
  isDisabled?: boolean;
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
  
  // Menu items avec leurs permissions
  menuItems: MenuItem[] = [
    { 
      path: '/dashboard', 
      label: 'Tableau de bord', 
      icon: 'dashboard',
      requiredLevel: 0 // Accessible à tous
    },
    { 
      path: '/utilisateurs', 
      label: 'Utilisateurs', 
      icon: 'users',
      requiredRoles: ['ADMIN','SUPER_ADMINISTRATOR', 'MAIN_ADMINISTRATOR'],
      requiredLevel: 4 // Niveau 4 et plus
    },
    { 
      path: '/campagne', 
      label: 'Campagnes', 
      icon: 'campaigns',
      requiredRoles: ['ADMIN','SUPER_ADMINISTRATOR', 'MAIN_ADMINISTRATOR', 'TREASURER',],
      requiredLevel: 2 // Accès financier requis
    },
    { 
      path: '/actu', 
      label: 'Actualités', 
      icon: 'news',
      requiredRoles: ['ADMIN','SUPER_ADMINISTRATOR', 'MAIN_ADMINISTRATOR', 'CONTENT_ADMINISTRATOR', 'ADMIN'],
      requiredLevel: 3 // Gestion de contenu
    },
    { 
      path: '/parametres', 
      label: 'Paramètres', 
      icon: 'settings',
      requiredRoles: ['ADMIN','SUPER_ADMINISTRATOR', 'MAIN_ADMINISTRATOR'],
      requiredLevel: 4 // Paramètres système
    },
    { 
      path: '/oppor', 
      label: 'Opportunités', 
      icon: 'opportunities',
      requiredRoles: ['ADMIN','SUPER_ADMINISTRATOR', 'MAIN_ADMINISTRATOR', 'CONTENT_ADMINISTRATOR'],
      requiredLevel: 3 // Gestion de contenu
    },
    { 
      path: '/full-video', 
      label: 'Vidéos', 
      icon: 'videos',
      requiredRoles: ['ADMIN','SUPER_ADMINISTRATOR', 'MAIN_ADMINISTRATOR', 'CONTENT_ADMINISTRATOR'],
      requiredLevel: 3 // Gestion de contenu
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // S'abonner aux changements de l'utilisateur connecté
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => {
        console.log('Utilisateur reçu dans sidebar:', user); // Debug
        this.currentUser = user;
        this.updateMenuPermissions();
      })
    );

    // Charger l'utilisateur actuel si déjà connecté
    this.currentUser = this.authService.getCurrentUser();
    console.log('Utilisateur actuel au démarrage:', this.currentUser); // Debug
    this.updateMenuPermissions();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Met à jour les permissions des menus selon l'utilisateur connecté
   */
  private updateMenuPermissions(): void {
    if (!this.currentUser) {
      // Si pas d'utilisateur, désactiver tous les menus sauf dashboard
      this.menuItems.forEach(item => {
        item.isVisible = item.path === '/dashboard';
        item.isDisabled = item.path !== '/dashboard';
      });
      return;
    }

    const userRole = this.currentUser.role?.toUpperCase();
    const userLevel = this.getUserLevel(userRole);

    console.log('Rôle utilisateur:', userRole, 'Niveau:', userLevel); // Debug

    this.menuItems.forEach(item => {
      const hasPermission = this.checkPermission(item, userRole, userLevel);
      item.isVisible = hasPermission;
      item.isDisabled = !hasPermission;
    });
  }

  /**
   * Vérifie si l'utilisateur a les permissions pour accéder à un menu
   */
  private checkPermission(item: MenuItem, userRole?: string, userLevel?: number): boolean {
    // Tableau de bord accessible à tous les utilisateurs connectés
    if (item.path === '/dashboard') {
      return true;
    }

    // Si pas de rôle défini, accès refusé (sauf dashboard)
    if (!userRole || userLevel === undefined) {
      return false;
    }

    // Vérification par niveau minimum requis
    if (item.requiredLevel !== undefined && userLevel < item.requiredLevel) {
      return false;
    }

    // Vérification par rôles autorisés
    if (item.requiredRoles && item.requiredRoles.length > 0) {
      return item.requiredRoles.includes(userRole);
    }

    return true;
  }

  /**
   * Retourne le niveau d'accès selon le rôle
   */
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

  /**
   * Retourne le nom d'affichage du rôle
   */
  getUserRoleDisplay(): string {
    console.log('getCurrentUser dans getUserRoleDisplay:', this.currentUser); // Debug
    
    if (!this.currentUser?.role) {
      console.log('Pas de rôle trouvé, retour Utilisateur'); // Debug
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
    
    console.log('Rôle:', roleKey, 'Nom affiché:', displayName); // Debug
    return displayName;
  }

  /**
   * Retourne le nom d'utilisateur (email/téléphone)
   */
  getUserDisplayName(): string {
    if (!this.currentUser) return 'Utilisateur';
    
    // Essayer firstname + secondname d'abord, puis email
    if (this.currentUser.firstname || this.currentUser.secondname) {
      return `${this.currentUser.firstname || ''} ${this.currentUser.secondname || ''}`.trim();
    }
    
    return this.currentUser.email || this.currentUser.username || 'Utilisateur';
  }

  /**
   * Vérifie si un lien est actif
   */
  isActive(path: string): boolean {
    return this.router.url.includes(path);
  }

  /**
   * Vérifie si l'utilisateur est connecté
   */
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  /**
   * Gère la déconnexion
   */
  logout(): void {
    this.authService.logout();
  }

  /**
   * Navigation vers un menu (avec vérification des permissions)
   */
  navigateTo(path: string): void {
    const menuItem = this.menuItems.find(item => item.path === path);
    if (menuItem && !menuItem.isDisabled) {
      this.router.navigate([path]);
    }
  }

  // *** MÉTHODES HELPER AJOUTÉES POUR LE TEMPLATE ***

  /**
   * Retourne l'item de menu pour un chemin donné
   */
  getMenuItem(path: string): MenuItem | undefined {
    return this.menuItems.find(item => item.path === path);
  }

  /**
   * Vérifie si un menu est visible
   */
  isMenuVisible(path: string): boolean {
    const item = this.getMenuItem(path);
    return item?.isVisible || false;
  }

  /**
   * Vérifie si un menu est désactivé
   */
  isMenuDisabled(path: string): boolean {
    const item = this.getMenuItem(path);
    return item?.isDisabled || false;
  }
}