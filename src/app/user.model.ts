// src/app/models/user.model.ts
export interface User {
    id: number;
    firstname: string;
    secondname: string;
    email: string;
    role: string;
    activated: boolean;
    annee?: string;
    centreinteret?: CentreInteret[];
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
    username?: string;
    authorities?: Authority[];
    accountNonExpired?: boolean;
    credentialsNonExpired?: boolean;
    accountNonLocked?: boolean;
    enabled?: boolean;
    selected?: boolean; // Pour la sélection dans l'interface utilisateur
  }
  
  export interface CentreInteret {
    id: number;
    libelle: string;
  }
  
  export interface Authority {
    authority: string;
  }