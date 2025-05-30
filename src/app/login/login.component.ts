import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^7[05678]\d{7}$/; // Format Sénégal : 70, 75, 76, 77, 78 + 7 chiffres
    return phoneRegex.test(phone);
  }

  onSubmit() {
    // Réinitialiser le message d'erreur
    this.errorMessage = '';
    
    // Valider les champs
    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez saisir votre numéro de téléphone et votre mot de passe';
      return;
    }

    /*if (!this.isValidPhoneNumber(this.email)) {
      this.errorMessage = 'Numéro de téléphone invalide (format attendu : 77XXXXXXX)';
      return;
    }*/

    this.isLoading = true;

    this.authService.login(this.email, this.password, this.rememberMe)
      .subscribe({
        next: (response) => {
          // Vérifier que la réponse contient bien un token avant de rediriger
          if (response && response.token) {
            console.log('Connexion réussie');
            const user = this.authService.getCurrentUser();
            if (user) {
              console.log(`Bienvenue, ${user.email}!`);
            }
            this.isLoading = false;
            this.router.navigate(['/dashboards']);
          } else {
            // Pas de redirection si pas de token
            this.isLoading = false;
            this.errorMessage = 'Réponse invalide du serveur';
            console.error('Erreur: réponse sans token', response);
          }
        },
        error: (error) => {
          this.isLoading = false;
          
          // Gérer explicitement le message d'erreur du backend
          if (error.message) {
            this.errorMessage = error.message;
          } else if (error.error && error.error.error) {
            this.errorMessage = error.error.error;
          } else if (error.status === 403 || error.status === 401) {
            this.errorMessage = 'Numéro de téléphone ou mot de passe invalide';
          } else {
            this.errorMessage = 'Une erreur est survenue lors de la connexion. Veuillez réessayer plus tard.';
          }
          
          console.error('Erreur de connexion:', error);
        }
      });
  }
}