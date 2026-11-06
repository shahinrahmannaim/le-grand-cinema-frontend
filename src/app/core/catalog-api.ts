import { inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface Film {
  id: string;
  title: string;
  synopsis: string;
  durationMinutes: number;
  genre: string;
  posterUrl: string | null;
}
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', { factory: () => '/api' });
@Injectable({ providedIn: 'root' })
export class CatalogApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  films(): Observable<Film[]> {
    return this.http.get<Film[]>(`${this.base}/catalog/films`);
  }
}
