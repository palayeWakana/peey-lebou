// Ajoutons les nouvelles méthodes pour la création d'actualités
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

// Interface for individual content item
export interface ContentItem {
  imagePath: any;
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
  alaUne: boolean;
  contenu: string; // Contenu HTML de l'article
}

// Interface pour la création d'actualité
export interface ActuCreateRequest {
  auteur: string;
  auteurimg: string;
  categorie: string;
  date: string;
  lien: string;
  descr: string;
  idauteur: number;
  img: string;
  isvalid: boolean;
  role: string;
  titre: string;
  alaune: boolean;
}

// Interface for pagination info
export interface Pageable {
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
}

// Interface for the complete response
export interface ActuResponse {
  content: ContentItem[];
  pageable: Pageable;
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

@Injectable({
  providedIn: 'root'
})
export class InfoService {
  // URL de base de l'API
  private readonly baseApiUrl = 'https://peeyconnect.net/api/v1';
  
  // URL pour les actualités - Nouvelle URL
  private readonly actuApiUrl = `${this.baseApiUrl}/actu/all`;
  
  // URL pour les opportunités (si différent)
  private readonly opportApiUrl = `${this.baseApiUrl}/actu/all`; // À modifier si nécessaire

  constructor(private http: HttpClient) { }

  /**
   * Récupère toutes les actualités (sans pagination côté serveur)
   * @param page Numéro de page (non utilisé car pagination côté client)
   * @param size Nombre d'éléments par page (non utilisé car pagination côté client)
   * @returns Observable de type ContentItem[]
   */
  getActus(page: number = 0, size: number = 12): Observable<ContentItem[]> {
    // Plus besoin de paramètres de pagination car ils ne sont pas pris en charge
    return this.http.get<ContentItem[]>(this.actuApiUrl);
  }

  /**
   * Récupère les opportunités (sans pagination côté serveur)
   * @param page Numéro de page (non utilisé car pagination côté client)
   * @param size Nombre d'éléments par page (non utilisé car pagination côté client)
   * @returns Observable de type ContentItem[]
   */
  getOpportunites(page: number = 0, size: number = 12): Observable<ContentItem[]> {
    return this.http.get<ContentItem[]>(this.opportApiUrl);
  }

  /**
   * Récupère une actualité spécifique par son ID
   * @param id L'ID de l'actualité
   * @returns Observable de type ContentItem
   */
  getActuById(id: number): Observable<ContentItem> {
    return this.http.get<ContentItem>(`${this.baseApiUrl}/actu/${id}`);
  }

  /**
   * Récupère les actualités filtrées par catégorie
   * @param category La catégorie à filtrer
   * @returns Observable de type ContentItem[]
   */
  getActusByCategory(category: string): Observable<ContentItem[]> {
    // Récupère toutes les actualités d'abord, filtrage à faire côté client
    return this.http.get<ContentItem[]>(this.actuApiUrl);
  }

  /**
   * Récupère les actualités mises en avant (alaUne = true)
   * @returns Observable de type ContentItem[]
   */
  getFeaturedActus(): Observable<ContentItem[]> {
    // Récupère toutes les actualités d'abord, filtrage à faire côté client
    return this.http.get<ContentItem[]>(this.actuApiUrl);
  }
  
  /**
   * Valide ou invalide une actualité
   * @param status Statut de validation (true ou false)
   * @param id ID de l'actualité
   * @returns Observable de type ContentItem
   */
  toggleActuValidation(status: boolean, id: number): Observable<ContentItem> {
    // Utilisation du nouvel endpoint avec status et false pour alaune (par défaut)
    return this.http.get<ContentItem>(`${this.baseApiUrl}/actu/valid/${status}/false/${id}`);
  }
  
  /**
   * Valide ou invalide une actualité ou opportunité avec contrôle du statut alaUne
   * @param status Statut de validation (true ou false)
   * @param alaune Statut alaUne (true ou false)
   * @param id ID de l'actualité ou opportunité
   * @returns Observable de type ContentItem
   */
  toggleValidation(status: boolean, alaune: boolean, id: number): Observable<ContentItem> {
    return this.http.get<ContentItem>(`${this.baseApiUrl}/actu/valid/${status}/${alaune}/${id}`);
  }

  /**
   * Récupère uniquement les actualités validées
   * @returns Observable de type ContentItem[]
   */
  getActuValid(): Observable<ContentItem[]> {
    return this.http.get<ContentItem[]>(`${this.baseApiUrl}/actu/valid`);
  }

  /**
   * Crée une nouvelle actualité avec FormData
   * @param formData Les données de l'actualité au format FormData
   * @returns Observable de type ContentItem
   */
  createActualite(formData: FormData): Observable<ContentItem> {
    return this.http.post<ContentItem>(`${this.baseApiUrl}/actu/save`, formData);
  }

  /**
   * Crée une nouvelle actualité avec un objet JSON
   * @param actuData Les données de l'actualité au format JSON
   * @returns Observable de type ContentItem
   */
  createActualiteJson(actuData: ActuCreateRequest): Observable<ContentItem> {
    return this.http.post<ContentItem>(`${this.baseApiUrl}/actu/save`, actuData);
  }

  /**
   * Méthode générique pour enregistrer des données via FormData
   * @param formData Les données du formulaire
   * @param endpoint L'endpoint API
   * @returns Observable du type attendu
   */
  saveFormData<T>(formData: FormData, endpoint: string): Observable<T> {
    return this.http.post<T>(`${this.baseApiUrl}${endpoint}`, formData);
  }
}