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
export const routes: Routes = [
  { path: '', loadComponent: () => import('./catalog/catalog-page').then((m) => m.CatalogPage) },
  { path: 'login', loadComponent: () => import('./pages/login-page').then((m) => m.LoginPage) },
  { path: '**', redirectTo: '' },
];
