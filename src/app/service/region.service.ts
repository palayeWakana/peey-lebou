import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Region {
  id?: number;
  libelle: string;
  code: string;
}

export interface Departement {
  id?: number;
  libelle: string;
  code: string;
  linkedRegion?: Region;
}

export interface CreateRegionRequest {
  libelle: string;
  code: string;
}

export interface CreateDepartementRequest {
  libelle: string;
  code: string;
}

@Injectable({
  providedIn: 'root'
})
export class RegionService {
  private baseUrl = 'https://peeyconnect.net/api';

  constructor(private http: HttpClient) {}

  // Récupérer toutes les régions
  getRegions(): Observable<Region[]> {
    return this.http.get<Region[]>(`${this.baseUrl}/regions`);
  }

  // Créer une nouvelle région
  saveRegion(region: CreateRegionRequest): Observable<Region> {
    return this.http.post<Region>(`${this.baseUrl}/regions`, region);
  }

  // Récupérer les départements d'une région
  getDepartementsByRegion(idRegion: number): Observable<Departement[]> {
    return this.http.get<Departement[]>(`${this.baseUrl}/departements/region/${idRegion}`);
  }

  // Ajouter un département à une région
  saveDepartement(idRegion: number, departement: CreateDepartementRequest): Observable<Departement> {
    return this.http.post<Departement>(`${this.baseUrl}/departements/region/${idRegion}`, departement);
  }
}