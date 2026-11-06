import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from './catalog-api';
export interface Account {
  id: string;
  email: string;
  displayName: string;
  role: 'CLIENT' | 'STAFF' | 'ADMIN';
}
export interface Seat {
  id: string;
  rowNumber: number;
  seatNumber: number;
  occupied: boolean;
}
export interface Plan {
  screeningId: string;
  title: string;
  roomName: string;
  startsAt: string;
  priceCents: number;
  seats: Seat[];
}
export interface Ticket {
  id: string;
  reference: string;
  title: string;
  roomName: string;
  startsAt: string;
  status: string;
  channel: string;
  totalCents: number;
  seats: string[];
}
export interface Booking {
  screeningId: string;
  seatIds: string[];
  idempotencyKey: string;
}
@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);
  readonly base = inject(API_BASE_URL);
  get<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
    return firstValueFrom(this.http.get<T>(this.base + path, { params, withCredentials: true }));
  }
  async write<T>(
    method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body: unknown,
  ): Promise<T> {
    const csrf = await this.get<{ token: string; headerName: string }>('/auth/csrf');
    return firstValueFrom(
      this.http.request<T>(method, this.base + path, {
        body,
        withCredentials: true,
        headers: { [csrf.headerName]: csrf.token },
      }),
    );
  }
}
export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 401)
      return 'Connectez-vous pour continuer. Votre session a peut-être expiré.';
    if (error.status === 403) return 'Action refusée. Actualisez la page et vérifiez vos droits.';
    if (error.status === 429) return 'Trop de tentatives. Réessayez dans une minute.';
    if (error.status === 0) return 'Connexion interrompue. Vérifiez votre réseau puis réessayez.';
    if (typeof error.error?.detail === 'string') return error.error.detail;
  }
  return 'Le serveur est indisponible. Réessayez dans un instant.';
}
export function euro(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}
export function dateTime(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Paris',
  }).format(new Date(value));
}
export function today(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' }).format(new Date());
}
