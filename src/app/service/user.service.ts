import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, NewUser } from '../utilisateur/utilisateur.component';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'https://peeyconnect.net/api/v1';
  
  constructor(private http: HttpClient) { }
  
  /**
   * Récupérer tous les utilisateurs
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/user/all`);
  }
  
  /**
   * Récupérer un utilisateur par son ID
   * @param id ID de l'utilisateur à récupérer
   */
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/user/${id}`);
  }
  
  /**
   * Créer un nouvel utilisateur
   * @param newUser Données du nouvel utilisateur
   */
  createUser(newUser: NewUser): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/signup`, newUser);
  }
  
  /**
   * Mettre à jour un utilisateur existant
   * @param id ID de l'utilisateur à mettre à jour
   * @param userData Données mises à jour de l'utilisateur
   */
  updateUser(id: number, userData: Partial<NewUser>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/user/update/${id}`, userData);
  }
  
  /**
   * Supprimer un utilisateur par son ID
   * @param id ID de l'utilisateur à supprimer
   */
  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/user/user/${id}`);
  }
  
  /**
   * Supprimer plusieurs utilisateurs
   * @param ids Tableau d'IDs des utilisateurs à supprimer
   */
  deleteMultipleUsers(ids: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/delete-multiple`, { ids });
  }
  
  /**
   * Modifier le rôle d'un utilisateur
   * @param id ID de l'utilisateur
   * @param role Nouveau rôle à attribuer
   */
  changeUserRole(id: number, role: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/user/${id}/role`, { role });
  }
  
  /**
   * Activer ou désactiver un utilisateur
   * @param id ID de l'utilisateur
   * @param status État d'activation (true pour activer, false pour désactiver)
   */
  toggleUserActivation(id: number, status: boolean): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/user/${id}/activation`, { activated: status });
  }
}

// le ts

// voici le ts et le html pour les utilisateurs

// je veux que tu ajoutes pour quand on clique sur l'icone de modification on affiche le formulaire du user concerner on charge les informations du formulaire sur les champs en donnant la possibilité de modifier et d'enregistrer

// voici le ts et le service 

// appelle  la  methode updateUser  dans le ts du  service  qui  modifie  le user  et l'utiliser dans le html 

// donne le htnl ,csss et ts bien adapté 