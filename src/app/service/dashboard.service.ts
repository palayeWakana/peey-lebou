import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces pour les réponses des endpoints
export interface UsersDashboardResponse {
  totalUsers: number;
  totalMen: number;
  totalWomen: number;
}

export interface CampaignsDashboardResponse {
  totalCampaigns: number;
}

export interface ActuDashboardResponse {
  totalActus: number;
}

export interface OpportuniteDashboardResponse {
  totalOpportunites: number;
}

export interface VideosDashboardResponse {
  totalVideos: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly baseApiUrl = 'https://peeyconnect.net/api/v1';

  constructor(private http: HttpClient) { }

  /**
   * Récupère les statistiques des utilisateurs
   * @returns Observable avec le total des utilisateurs, hommes et femmes
   */
  getDecompteUsers(): Observable<UsersDashboardResponse> {
    return this.http.get<UsersDashboardResponse>(`${this.baseApiUrl}/user/dashboard`);
  }

  /**
   * Récupère le nombre total de campagnes
   * @returns Observable avec le total des campagnes
   */
  getDecompteCampaign(): Observable<CampaignsDashboardResponse> {
    return this.http.get<CampaignsDashboardResponse>('https://peeyconnect.net/api/campaigns/dashboard');
  }

  /**
   * Récupère le nombre total d'actualités
   * @returns Observable avec le total des actualités
   */
  getDecompteActu(): Observable<ActuDashboardResponse> {
    return this.http.get<ActuDashboardResponse>(`${this.baseApiUrl}/actu/dashboard`);
  }

  /**
   * Récupère le nombre total d'opportunités
   * @returns Observable avec le total des opportunités
   */
  getDecompteOppor(): Observable<OpportuniteDashboardResponse> {
    return this.http.get<OpportuniteDashboardResponse>(`${this.baseApiUrl}/opportunite/dashboard`);
  }

  /**
   * Récupère le nombre total de vidéos
   * @returns Observable avec le total des vidéos
   */
  getDecompteVideos(): Observable<VideosDashboardResponse> {
    return this.http.get<VideosDashboardResponse>(`${this.baseApiUrl}/video/dashboard`);
  }
}