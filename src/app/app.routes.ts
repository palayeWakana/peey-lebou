import { Routes } from '@angular/router';
import { LatestComponent } from './latest/latest.component';
import { DetailsComponent } from './details/details.component';
import { OpportunitesComponent } from './opportunites/opportunites.component';
import { OpportuniteDetailsComponent } from './opportunite-details/opportunite-details.component';
import { AccueilComponent } from './accueil/accueil.component';
import { LoginComponent } from './login/login.component';
import { UtilisateurComponent } from './utilisateur/utilisateur.component';
import { CategorieListComponent } from './cathegorie-list/cathegorie-list.component';
 import { OpporComponent } from './oppor/oppor.component';
import { ActuComponent } from './actu/actu.component';
import { FullVideoComponent } from './full-video/full-video.component';
import { CampagneComponent } from './campagne/campagne.component';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'accueil',
    pathMatch: 'full'
  },
  { 
    path: 'login',
    component: LoginComponent,
    title: 'Connexion'
  },
  {
    path: 'utilisateurs',
    component: UtilisateurComponent,
    title: 'Utilisateurs'
  },
  {
    path: 'parametres',
    component: CategorieListComponent,
    title: 'Parametres'
  },
  { 
    path: 'accueil', 
    component: AccueilComponent,
    title: 'Accueil'
  },
  { 
    path: 'campagne', 
    component: CampagneComponent,
    title: 'Campagne'
  },
  { 
    path: 'actualites', 
    component: LatestComponent,
    title: 'Actualités' 
  },
  { 
    path: 'full-video', 
    component: FullVideoComponent,
    title: 'Full-video' 
  },
  { 
    path: 'details/:id', 
    component: DetailsComponent,
    title: 'Détails actualité',
    data: {
      reuseComponent: false // Force le rechargement du composant
    }
  },
  { 
    path: 'opportunites', 
    component: OpportunitesComponent,
    title: 'Opportunités' 
  },
  { 
    path: 'oppor', 
    component: OpporComponent,
    title: 'Oppor' 
  },
  { 
    path: 'actu', 
    component: ActuComponent,
    title: 'Actu' 
  },
  { 
    path: 'opportunite-details/:id', 
    component: OpportuniteDetailsComponent,
    title: 'Détails opportunité',
    data: {
      reuseComponent: false // Force le rechargement du composant
    }
  },
  // { 
  //   path: '**', 
  //   redirectTo: 'login',
  //   pathMatch: 'full' 
  // }
];