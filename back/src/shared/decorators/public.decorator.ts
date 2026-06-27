import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marque une route (ou un contrôleur) comme publique : le {@link AuthGuard}
 * global la laisse passer sans vérifier le Bearer.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
