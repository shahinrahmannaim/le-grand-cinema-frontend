import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { Auth } from './core/auth';
const signedIn: CanActivateFn = async (_, state) => {
  const auth = inject(Auth),
    router = inject(Router);
  await auth.load();
  return auth.user()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { next: state.url } });
};
const staff: CanActivateFn = async () => {
  const auth = inject(Auth),
    router = inject(Router);
  await auth.load();
  return auth.staff() ? true : router.createUrlTree(['/login']);
};
const admin: CanActivateFn = async () => {
  const auth = inject(Auth),
    router = inject(Router);
  await auth.load();
  return auth.user()?.role === 'ADMIN' ? true : router.createUrlTree(['/']);
};
export const routes: Routes = [
  { path: '', loadComponent: () => import('./catalog/catalog-page').then((m) => m.CatalogPage) },
  { path: 'login', loadComponent: () => import('./pages/login-page').then((m) => m.LoginPage) },
  {
    path: 'reserve/:id',
    loadComponent: () => import('./pages/reservation-page').then((m) => m.ReservationPage),
  },
  {
    path: 'tickets/:id',
    canActivate: [signedIn],
    loadComponent: () => import('./pages/tickets-page').then((m) => m.TicketsPage),
  },
  {
    path: 'tickets',
    canActivate: [signedIn],
    loadComponent: () => import('./pages/tickets-page').then((m) => m.TicketsPage),
  },
  {
    path: 'staff',
    canActivate: [staff],
    loadComponent: () => import('./pages/staff-page').then((m) => m.StaffPage),
  },
  {
    path: 'admin',
    canActivate: [admin],
    loadComponent: () => import('./pages/admin-page').then((m) => m.AdminPage),
  },
  { path: '**', redirectTo: '' },
];
