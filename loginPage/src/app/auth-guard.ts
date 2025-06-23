import { inject } from '@angular/core';
import { CanActivateFn , Router} from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  const token = isBrowser ? localStorage.getItem('jwt') : null;
  if(token) {
    return true;
  }
  else{
    router.navigate(['/login']);
    return false;
  }
};
