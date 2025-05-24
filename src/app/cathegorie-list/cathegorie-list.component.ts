import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Categorie, ParametreService } from './../parametre.service';
import { CategorieCreateComponent } from '../cathegorie-create/cathegorie-create.component';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { HeaderComponent } from "../header/header.component";

@Component({
  selector: 'app-categorie-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CategorieCreateComponent,
    SidebarComponent,
    HeaderComponent
],
  templateUrl: './cathegorie-list.component.html',
  styleUrls: ['./cathegorie-list.component.css']
})
export class CategorieListComponent implements OnInit {
  categories: Categorie[] = [];
  filteredCategories: Categorie[] = [];
  displayedCategories: Categorie[] = [];
  selectedType: string = 'Tous';
  loading = false;
  error: string | null = null;
  showAddForm = false;
  
  // Paramètres de pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;
  
  typeOptions = ['Tous', 'Actualités', 'Opportunités'];

  constructor(private parametreService: ParametreService) { }

  ngOnInit(): void {
    this.loadAllCategories();
  }

  loadAllCategories(): void {
    this.loading = true;
    this.error = null;
    
    this.parametreService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.filteredCategories = data;
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Impossible de charger les catégories. Vérifiez votre connexion ou réessayez plus tard.';
        this.loading = false;
        console.error('Erreur:', err);
      }
    });
  }

  filterByType(type: string): void {
    this.selectedType = type;
    this.error = null;
    
    if (type === 'Tous') {
      this.filteredCategories = [...this.categories];
      this.updatePagination();
      return;
    }
    
    this.loading = true;
    this.parametreService.getCategoriesByType(type).subscribe({
      next: (data) => {
        this.filteredCategories = data;
        this.currentPage = 1; // Réinitialiser à la première page lors du filtrage
        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        this.error = `Impossible de filtrer les catégories par type ${type}`;
        this.loading = false;
        console.error('Erreur:', err);
      }
    });
  }

  deleteCategorie(id: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      return;
    }
    
    this.parametreService.deleteCategorie(id).subscribe({
      next: () => {
        this.categories = this.categories.filter(c => c.id !== id);
        this.filteredCategories = this.filteredCategories.filter(c => c.id !== id);
        this.updatePagination();
      },
      error: (err) => {
        this.error = 'Échec de la suppression. Veuillez réessayer.';
        console.error('Erreur:', err);
      }
    });
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
  }

  onCategorieAdded(newCategorie: Categorie): void {
    this.categories = [...this.categories, newCategorie];
    
    if (this.selectedType === 'Tous' || this.selectedType === newCategorie.type) {
      this.filteredCategories = [...this.filteredCategories, newCategorie];
      this.updatePagination();
    }
    
    this.showAddForm = false;
  }

  retry(): void {
    if (this.selectedType === 'Tous') {
      this.loadAllCategories();
    } else {
      this.filterByType(this.selectedType);
    }
  }

  // Méthodes de pagination
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredCategories.length / this.itemsPerPage);
    
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    
    this.updateDisplayedCategories();
  }

  updateDisplayedCategories(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredCategories.length);
    
    this.displayedCategories = this.filteredCategories.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedCategories();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateDisplayedCategories();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayedCategories();
    }
  }

  getPageArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  changeItemsPerPage(value: number): void {
    this.itemsPerPage = value;
    this.currentPage = 1;
    this.updatePagination();
  }
}