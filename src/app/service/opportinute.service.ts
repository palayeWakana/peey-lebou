import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OpportuniteItem {
  id: number;
  auteur: string;
  auteurimg: string;
  categorie: string;
  lien: string;
  date: string;
  descr: string;
  idauteur: number;
  img: string;
  isvalid: boolean;
  role: string;
  titre: string;
  alaune: boolean;
}

export interface OpportuniteResponse {
  content: OpportuniteItem[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  first: boolean;
  empty: boolean;
}

// Interface pour les données JSON de création d'opportunité
export interface CreateOpportuniteData {
  titre: string;
  descr: string;
  lien: string;
  categorie: string;
  date: string;
  isvalid: boolean;
  alaune: boolean;
  idauteur: number;
  auteur: string;
  role: string;
  auteurimg: string;
}

@Injectable({
  providedIn: 'root'
})
export class OpportuniteService {
  private baseUrl = 'https://peeyconnect.net/api/v1';
  
  constructor(private http: HttpClient) { }

  // Récupérer toutes les opportunités paginées
  getOpportunites(page: number = 0, size: number = 12): Observable<OpportuniteResponse> {
    return this.http.get<OpportuniteResponse>(`${this.baseUrl}/opportunite/pages?page=${page}&size=${size}`);
  }

  // Récupérer une opportunité par ID
  getOpportuniteById(id: number): Observable<OpportuniteItem> {
    return this.http.get<OpportuniteItem>(`${this.baseUrl}/opportunite/${id}`);
  }
  
  // Récupérer toutes les opportunités (retourne directement un tableau)
  getAllOpportunite(): Observable<OpportuniteItem[]> {
    return this.http.get<OpportuniteItem[]>(`${this.baseUrl}/opportunite/all`);
  }

  // Méthode pour valider/invalider une opportunité
  toggleValidation(id: number, status: boolean): Observable<OpportuniteItem> {
    return this.http.get<OpportuniteItem>(`${this.baseUrl}/opportunite/valid/${status}/false/${id}`);
  }

  // Version 1: Créer une opportunité avec FormData (pour upload de fichiers)
  createOpportunite(formData: FormData): Observable<OpportuniteItem> {
    return this.http.post<OpportuniteItem>(`${this.baseUrl}/opportunite/save`, formData);
  }

  // Version 2: Créer une opportunité avec données JSON (sans fichier)
  createOpportuniteJSON(data: CreateOpportuniteData): Observable<OpportuniteItem> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.post<OpportuniteItem>(`${this.baseUrl}/opportunite/save`, data, { headers });
  }

  // Version 3: Upload d'image séparé
  uploadImage(opportuniteId: number, formData: FormData): Observable<OpportuniteItem> {
    return this.http.post<OpportuniteItem>(`${this.baseUrl}/opportunite/${opportuniteId}/upload-image`, formData);
  }

  // Alternative pour l'upload d'image si l'endpoint est différent
  uploadImageAlternative(opportuniteId: number, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/opportunite/update-image/${opportuniteId}`, formData);
  }

  // Méthode pour mettre à jour une opportunité complète
  updateOpportunite(id: number, formData: FormData): Observable<OpportuniteItem> {
    return this.http.put<OpportuniteItem>(`${this.baseUrl}/opportunite/update/${id}`, formData);
  }

  // Méthode pour mettre à jour une opportunité avec JSON
  updateOpportuniteJSON(id: number, data: Partial<CreateOpportuniteData>): Observable<OpportuniteItem> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.put<OpportuniteItem>(`${this.baseUrl}/opportunite/update/${id}`, data, { headers });
  }

  // Méthode pour supprimer une opportunité
  deleteOpportunite(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/opportunite/delete/${id}`);
  }

  // Méthode pour récupérer les opportunités par catégorie
  getOpportunitesByCategorie(categorie: string, page: number = 0, size: number = 12): Observable<OpportuniteResponse> {
    return this.http.get<OpportuniteResponse>(`${this.baseUrl}/opportunite/categorie/${categorie}?page=${page}&size=${size}`);
  }

  // Méthode pour récupérer les opportunités validées seulement
  getValidatedOpportunites(page: number = 0, size: number = 12): Observable<OpportuniteResponse> {
    return this.http.get<OpportuniteResponse>(`${this.baseUrl}/opportunite/validated?page=${page}&size=${size}`);
  }

  // Méthode pour rechercher des opportunités
  searchOpportunites(query: string, page: number = 0, size: number = 12): Observable<OpportuniteResponse> {
    return this.http.get<OpportuniteResponse>(`${this.baseUrl}/opportunite/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`);
  }

  // Méthode pour créer une opportunité avec gestion automatique du type de contenu
  createOpportuniteAuto(data: CreateOpportuniteData, file?: File): Observable<OpportuniteItem> {
    if (file) {
      // Si un fichier est présent, utiliser FormData
      const formData = new FormData();
      
      // Ajouter toutes les propriétés de data au FormData
      Object.keys(data).forEach(key => {
        const value = (data as any)[key];
        formData.append(key, value?.toString() || '');
      });
      
      // Ajouter le fichier
      formData.append('file', file, file.name);
      
      return this.createOpportunite(formData);
    } else {
      // Si pas de fichier, utiliser JSON
      return this.createOpportuniteJSON(data);
    }
  }

  // Méthode utilitaire pour vérifier si un fichier est une image valide
  isValidImageFile(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return allowedTypes.includes(file.type);
  }

  // Méthode utilitaire pour valider la taille du fichier
  isValidFileSize(file: File, maxSizeInMB: number = 5): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  }
}