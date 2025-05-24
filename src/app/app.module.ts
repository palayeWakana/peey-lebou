import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CategorieListComponent } from './cathegorie-list/cathegorie-list.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    importProvidersFrom(
      FormsModule,
      ReactiveFormsModule
    ),
    provideRouter([
      { path: 'categories', component: CategorieListComponent },
      { path: '', redirectTo: '/categories', pathMatch: 'full' }
    ])
  ]
}).catch(err => console.error(err));