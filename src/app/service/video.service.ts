import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VideoCategorie {
  id: number;
  libelle: string;
}

export interface Video {
  id: number;
  auteur: string;
  auteurimg: string;
  categorie: string;
  videolink: string;
  date: string;
  descr: string;
  idauteur: number;
  img: string;
  isvalid: boolean;
  role: string;
  titre: string;
  vcategorie: VideoCategorie;
}
export interface VideoResponse {
  content: Video[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  first: boolean;
  empty: boolean;
}


export interface VideoCreateRequest {
  auteur: string;
  auteurimg: string;
  categorie: string;
  videolink: string;
  date: string;
  descr: string;
  idauteur: number;
  img: string;
  isvalid: boolean;
  role: string;
  titre: string;
  vcategorieId: number;
}

export interface ValidationResponse {
  success: boolean;
  message: string;
  video?: Video;
}

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private apiUrl = 'https://peeyconnect.net/api/v1';

  constructor(private http: HttpClient) { }

  getVideoValid(): Observable<Video[]> {
    return this.http.get<Video[]>(`${this.apiUrl}/video/valid`);
  }

  getAllVideo(): Observable<Video[]> {
    return this.http.get<Video[]>(`${this.apiUrl}/video/all`);
  }
  getVideos(page: number, size: number): Observable<VideoResponse> {
    return this.http.get<VideoResponse>(`${this.apiUrl}/video/home?page=${page}&size=${size}`);
  }
  getVideoById(id: number): Observable<Video> {
    return this.http.get<Video>(`${this.apiUrl}/video/${id}`);
  }

  updateVideoValidation(id: number, isValid: boolean): Observable<ValidationResponse> {
    const status = isValid ? 'true' : 'false';
    return this.http.get<ValidationResponse>(
      `${this.apiUrl}/video/valid/${status}/${id}`, 
      {}
    );
  }

  createVideo(videoData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/video/save`, videoData, {
      reportProgress: true,
      responseType: 'json'
    });
  }
  
  getVideoCategories(): Observable<VideoCategorie[]> {
    return this.http.get<VideoCategorie[]>(`${this.apiUrl}/video/categories`);
  }
}