import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CampagneService, Campagne, Cotisation, CotisationResponse } from '../campagne.service';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-campagne',
  standalone: true,
  templateUrl: './campagne.component.html',
  styleUrls: ['./campagne.component.css'],
  imports: [
    SidebarComponent,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DatePipe
  ]
})
export class CampagneComponent implements OnInit {
  baseUrl= 'https://peeyconnect.net/repertoire_upload/';
  campagnes: Campagne[] = [];
  currentPage: number = 0;
  pageSize: number = 4;
  totalPages: number = 0;
  totalItems: number = 0;
  loading: boolean = false;
  error: boolean = false;

  campagneForm: FormGroup;
  submitted: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  showPopup: boolean = false;
  selectedCampagne: Campagne | null = null;

  showDeleteConfirmation = false;
  campagneToDelete: number | null = null;

  // Nouvelles propriétés pour gérer les cotisations
  cotisations: Cotisation[] = [];
  cotisationsLoading: boolean = false;
  cotisationsError: boolean = false;
  cotisationCurrentPage: number = 0;
  cotisationPageSize: number = 5;
  cotisationTotalPages: number = 0;
  cotisationTotalItems: number = 0;
  
  // Message de confirmation pour le paiement
  paymentMessage: string = '';
  paymentSuccess: boolean = false;
  paymentLoading: boolean = false;

  Math = Math;
payingCotisationId: any;

  constructor(
    private campagneService: CampagneService,
    private router: Router,
    private formBuilder: FormBuilder
  ) {
    this.campagneForm = this.formBuilder.group({
      title: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      amount: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.fetchCampagnes();
  }

  get f() {
    return this.campagneForm.controls;
  }

  fetchCampagnes(): void {
    this.loading = true;
    this.error = false;

    this.campagneService.getCampagnes(this.currentPage, this.pageSize).subscribe({
      next: response => {
        this.campagnes = response.content;
        this.totalPages = response.totalPages;
        this.totalItems = response.totalElements;
        this.loading = false;
      },
      error: err => {
        console.error('Erreur lors du chargement des campagnes:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.campagneForm.invalid) return;

    this.loading = true;

    let startDateValue = this.campagneForm.value.startDate;
    let endDateValue = this.campagneForm.value.endDate;

    const formatDateToDDMMYYYY = (dateValue: any): string => {
      if (dateValue instanceof Date) {
        const day = String(dateValue.getDate()).padStart(2, '0');
        const month = String(dateValue.getMonth() + 1).padStart(2, '0');
        const year = dateValue.getFullYear();
        return `${day}-${month}-${year}`;
      } else if (typeof dateValue === 'string') {
        if (dateValue.includes('/')) {
          return dateValue.replace(/\//g, '-');
        } else if (dateValue.includes('-')) {
          const parts = dateValue.split('-');
          if (parts.length === 3 && parts[0].length === 4) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
          return dateValue;
        }
      }
      return dateValue;
    };

    startDateValue = formatDateToDDMMYYYY(startDateValue);
    endDateValue = formatDateToDDMMYYYY(endDateValue);

    const newCampagne = {
      title: this.campagneForm.value.title,
      startDate: startDateValue,
      endDate: endDateValue,
      amount: this.campagneForm.value.amount.toString()
    };

    this.campagneService.createCampagne(newCampagne).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Campagne créée avec succès!';
        this.resetForm();
        this.fetchCampagnes();
      },
      error: err => {
        this.loading = false;
        this.errorMessage = `Erreur lors de la création: ${err.status} ${err.statusText}`;
        if (err.error?.message) {
          this.errorMessage += ` - ${err.error.message}`;
        }
        console.error('Erreur détaillée:', err);
      }
    });
  }

  resetForm(): void {
    this.submitted = false;
    this.campagneForm.reset();
  }

  // --- Confirmation personnalisée pour la suppression ---
  openDeleteConfirmation(campagneId: number): void {
    this.campagneToDelete = campagneId;
    this.showDeleteConfirmation = true;
  }

  closeDeleteConfirmation(): void {
    this.showDeleteConfirmation = false;
    this.campagneToDelete = null;
  }

  confirmDelete(): void {
    if (this.campagneToDelete !== null) {
      this.deleteCampagne(this.campagneToDelete);
      this.closeDeleteConfirmation();
    }
  }

  deleteCampagne(id: number): void {
    this.loading = true;

    this.campagneService.deleteCampagne(id).subscribe({
      next: () => {
        this.fetchCampagnes();
      },
      error: err => {
        console.error('Erreur lors de la suppression:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }

  showCampagneDetails(campagne: Campagne): void {
    this.selectedCampagne = campagne;
    this.showPopup = true;
    document.body.style.overflow = 'hidden';
    
    // Charger les cotisations pour cette campagne
    this.fetchCotisationsByCampagne(campagne.id);
  }

  // Nouvelle méthode pour récupérer les cotisations d'une campagne
  fetchCotisationsByCampagne(campaignId: number): void {
    this.cotisationsLoading = true;
    this.cotisationsError = false;
    this.paymentMessage = '';
    this.paymentSuccess = false;

    this.campagneService.getCotisationByCampagne(campaignId, this.cotisationCurrentPage, this.cotisationPageSize).subscribe({
      next: (response: CotisationResponse) => {
        this.cotisations = response.content;
        this.cotisationTotalPages = response.totalPages;
        this.cotisationTotalItems = response.totalElements;
        this.cotisationsLoading = false;
      },
      error: err => {
        console.error('Erreur lors du chargement des cotisations:', err);
        this.cotisationsError = true;
        this.cotisationsLoading = false;
      }
    });
  }

  // Nouvelle méthode pour payer une cotisation
  payeCotisation(cotisationId: number): void {
    this.paymentLoading = true;
    this.paymentMessage = '';
    this.paymentSuccess = false;

    this.campagneService.payeCotisation(cotisationId).subscribe({
      next: () => {
        this.paymentLoading = false;
        this.paymentSuccess = true;
        this.paymentMessage = 'Cotisation payée avec succès!';
        
        // Rafraîchir la liste des cotisations
        if (this.selectedCampagne) {
          this.fetchCotisationsByCampagne(this.selectedCampagne.id);
        }
      },
      error: err => {
        this.paymentLoading = false;
        this.paymentSuccess = false;
        this.paymentMessage = `Erreur lors du paiement: ${err.status} ${err.statusText}`;
        console.error('Erreur détaillée lors du paiement:', err);
      }
    });
  }

  closePopup(): void {
    this.showPopup = false;
    this.selectedCampagne = null;
    this.cotisations = [];
    this.paymentMessage = '';
    document.body.style.overflow = '';
  }

  // Pagination principale pour les campagnes
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.fetchCampagnes();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.fetchCampagnes();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.fetchCampagnes();
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.fetchCampagnes();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let start = Math.max(0, this.currentPage - Math.floor(maxPages / 2));
    let end = Math.min(this.totalPages - 1, start + maxPages - 1);

    if (end - start + 1 < maxPages) {
      start = Math.max(0, end - maxPages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Pagination pour les cotisations
  goToCotisationPage(page: number): void {
    if (page >= 0 && page < this.cotisationTotalPages && this.selectedCampagne) {
      this.cotisationCurrentPage = page;
      this.fetchCotisationsByCampagne(this.selectedCampagne.id);
    }
  }

  nextCotisationPage(): void {
    if (this.cotisationCurrentPage < this.cotisationTotalPages - 1 && this.selectedCampagne) {
      this.cotisationCurrentPage++;
      this.fetchCotisationsByCampagne(this.selectedCampagne.id);
    }
  }

  previousCotisationPage(): void {
    if (this.cotisationCurrentPage > 0 && this.selectedCampagne) {
      this.cotisationCurrentPage--;
      this.fetchCotisationsByCampagne(this.selectedCampagne.id);
    }
  }

  getCotisationPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let start = Math.max(0, this.cotisationCurrentPage - Math.floor(maxPages / 2));
    let end = Math.min(this.cotisationTotalPages - 1, start + maxPages - 1);

    if (end - start + 1 < maxPages) {
      start = Math.max(0, end - maxPages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }
}