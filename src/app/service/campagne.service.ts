import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Campagne {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  amount: string;
}

export interface Cotisation {
  id: number;
  numero: string;
  datefacture: string;
  dateecheance: string ;
  montant: string;
  userid: string;
  profession: string;
  userimg: string;
  telephone: string;
  username: string;
  payed: boolean;
  campaign: Campagne;
}

export interface CampagneResponse {
  content: Campagne[];
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

export interface CotisationResponse {
  content: Cotisation[];
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

@Injectable({
  providedIn: 'root'
})
export class CampagneService {
  private apiUrl = 'https://peeyconnect.net/api';

  constructor(private http: HttpClient) { }

  getCampagnes(page: number = 0, size: number = 10): Observable<CampagneResponse> {
    return this.http.get<CampagneResponse>(`${this.apiUrl}/campaigns?page=${page}&size=${size}`);
  }

  getCampagneById(id: number): Observable<Campagne> {
    return this.http.get<Campagne>(`${this.apiUrl}/campaigns/${id}`);
  }

  createCampagne(campagne: Omit<Campagne, 'id'>): Observable<Campagne> {
    return this.http.post<Campagne>(`${this.apiUrl}/campaigns`, campagne);
  }

  deleteCampagne(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/campaigns/${id}`);
  }

  // Nouvelle méthode pour récupérer les cotisations d'une campagne
  getCotisationByCampagne(id: number, page: number = 0, size: number = 10): Observable<CotisationResponse> {
    return this.http.get<CotisationResponse>(`${this.apiUrl}/v1/cotisation/campaign/${id}?page=${page}&size=${size}`);
  }

  // Nouvelle méthode pour payer une cotisation
  payeCotisation(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/v1/cotisation/payed/${id}`, {});
  }
}