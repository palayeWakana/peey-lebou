import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RegionService, Region, Departement, CreateRegionRequest, CreateDepartementRequest } from '../service/region.service';
import { ReactiveFormsModule } from '@angular/forms';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-region',
  standalone:true,
  templateUrl: './region.component.html',
  styleUrls: ['./region.component.css'],
  imports: [ReactiveFormsModule, CommonModule,SidebarComponent]
})
export class RegionComponent implements OnInit {
  regionForm: FormGroup;
  departementForm: FormGroup;
  regions: Region[] = [];
  departements: Departement[] = [];
  loading = false;
  loadingDepartements = false;
  saving = false;
  savingDepartement = false;
  errorMessage = '';
  successMessage = '';
  
  // Pagination properties
  currentPage = 1;
  itemsPerPage = 3;
  totalPages = 0;
  paginatedRegions: Region[] = [];
  
  // Popup states
  showDepartementsPopup = false;
  showAddDepartementPopup = false;
  selectedRegion: Region | null = null;

  constructor(
    private fb: FormBuilder,
    private regionService: RegionService
  ) {
    this.regionForm = this.fb.group({
      libelle: ['', [Validators.required, Validators.minLength(2)]],
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(5)]]
    });

    this.departementForm = this.fb.group({
      libelle: ['', [Validators.required, Validators.minLength(2)]],
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(5)]]
    });
  }

  ngOnInit(): void {
    this.loadRegions();
  }

  loadRegions(): void {
    this.loading = true;
    this.errorMessage = '';
    
    this.regionService.getRegions().subscribe({
      next: (regions) => {
        this.regions = regions;
        this.updatePagination();
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement des régions';
        this.loading = false;
        console.error('Erreur:', error);
      }
    });
  }

  // Méthodes de pagination
  updatePagination(): void {
    this.totalPages = Math.ceil(this.regions.length / this.itemsPerPage);
    this.updatePaginatedRegions();
  }

  updatePaginatedRegions(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedRegions = this.regions.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedRegions();
    }
  }

  goToPreviousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  onSubmitRegion(): void {
    if (this.regionForm.valid) {
      this.saving = true;
      this.errorMessage = '';
      this.successMessage = '';

      const regionData: CreateRegionRequest = this.regionForm.value;

      this.regionService.saveRegion(regionData).subscribe({
        next: (region) => {
          this.successMessage = 'Région créée avec succès!';
          this.regionForm.reset();
          this.loadRegions();
          this.saving = false;
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          this.errorMessage = 'Erreur lors de la création de la région';
          this.saving = false;
          console.error('Erreur:', error);
        }
      });
    } else {
      this.markFormGroupTouched(this.regionForm);
    }
  }

  showDepartements(region: Region): void {
    this.selectedRegion = region;
    this.loadingDepartements = true;
    this.showDepartementsPopup = true;
    
    if (region.id) {
      this.regionService.getDepartementsByRegion(region.id).subscribe({
        next: (departements) => {
          this.departements = departements;
          this.loadingDepartements = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des départements:', error);
          this.departements = [];
          this.loadingDepartements = false;
        }
      });
    }
  }

  showAddDepartementForm(region: Region): void {
    this.selectedRegion = region;
    this.showAddDepartementPopup = true;
    this.departementForm.reset();
  }

  onSubmitDepartement(): void {
    if (this.departementForm.valid && this.selectedRegion?.id) {
      this.savingDepartement = true;
      
      const departementData: CreateDepartementRequest = this.departementForm.value;

      this.regionService.saveDepartement(this.selectedRegion.id, departementData).subscribe({
        next: (departement) => {
          this.departementForm.reset();
          this.showAddDepartementPopup = false;
          this.savingDepartement = false;
          
          // Si le popup des départements est ouvert, recharger la liste
          if (this.showDepartementsPopup) {
            this.showDepartements(this.selectedRegion!);
          }
        },
        error: (error) => {
          console.error('Erreur lors de la création du département:', error);
          this.savingDepartement = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.departementForm);
    }
  }

  closeDepartementsPopup(): void {
    this.showDepartementsPopup = false;
    this.selectedRegion = null;
    this.departements = [];
  }

  closeAddDepartementPopup(): void {
    this.showAddDepartementPopup = false;
    this.selectedRegion = null;
    this.departementForm.reset();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return 'Ce champ est requis';
      }
      if (field.errors['minlength']) {
        return `Minimum ${field.errors['minlength'].requiredLength} caractères`;
      }
      if (field.errors['maxlength']) {
        return `Maximum ${field.errors['maxlength'].requiredLength} caractères`;
      }
    }
    return '';
  }
}