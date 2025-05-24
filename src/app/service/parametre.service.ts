import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export interface Categorie {
  id?: number;
  libelle: string;
  type: string;
}

@Injectable({
  providedIn: 'root'
})
export class ParametreService {
  private baseUrl = 'https://peeyconnect.net/api/v1/parameters';

  constructor(private http: HttpClient) { }

  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      // Erreur client-side ou réseau
      console.error('Une erreur est survenue:', error.error);
    } else {
      // Le backend a retourné un code d'erreur
      console.error(
        `Le backend a retourné le code ${error.status}, ` +
        `message: ${error.error}`);
    }
    return throwError(() => new Error('Une erreur est survenue, veuillez réessayer plus tard.'));
  }

  getAllCategories(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(`${this.baseUrl}/categorie/all`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getCategoriesByType(type: string): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(`${this.baseUrl}/categorie/all/${type}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  createCategorie(categorie: Categorie): Observable<Categorie> {
    return this.http.post<Categorie>(`${this.baseUrl}/categorie/save`, categorie)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteCategorie(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/categorie/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateCategorie(categorie: Categorie): Observable<Categorie> {
    return this.http.put<Categorie>(`${this.baseUrl}/categorie/update`, categorie)
      .pipe(
        catchError(this.handleError)
      );
  }
}