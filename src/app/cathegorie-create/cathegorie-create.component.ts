import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Categorie, ParametreService } from './../parametre.service';

@Component({
  selector: 'app-categorie-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './cathegorie-create.component.html',
  styleUrls: ['./cathegorie-create.component.css']
})
export class CategorieCreateComponent implements OnInit {
  categorieForm!: FormGroup;
  submitted = false;
  loading = false;
  error = '';
  success = '';

  @Output() categorieAdded = new EventEmitter<Categorie>();
  
  // Types de catégories disponibles
  typeOptions = ['Actualités', 'Opportunités'];

  constructor(
    private formBuilder: FormBuilder,
    private parametreService: ParametreService
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  // Initialisation du formulaire avec validation
  initForm(): void {
    this.categorieForm = this.formBuilder.group({
      libelle: ['', [Validators.required, Validators.minLength(2)]],
      type: ['', Validators.required]
    });
  }

  // Récupération facile des contrôles du formulaire
  get f() { return this.categorieForm.controls; }

  // Soumission du formulaire
  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.success = '';

    // Arrêter là si le formulaire est invalide
    if (this.categorieForm.invalid) {
      return;
    }

    this.loading = true;
    const newCategorie: Categorie = {
      libelle: this.f['libelle'].value,
      type: this.f['type'].value
    };

    this.parametreService.createCategorie(newCategorie)
      .subscribe({
        next: (categorie) => {
          this.loading = false;
          this.success = 'Catégorie ajoutée avec succès';
          this.categorieAdded.emit(categorie);
          this.resetForm();
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Erreur lors de l\'ajout de la catégorie';
          console.error('Erreur:', err);
        }
      });
  }

  // Réinitialisation du formulaire
  resetForm(): void {
    this.submitted = false;
    this.categorieForm.reset();
  }
}