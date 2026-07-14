import { SetMetadata } from '@nestjs/common';

export const IS_RAW_RESPONSE_KEY = 'isRawResponse';

/**
 * Marque une route comme exemptée de {@link ResponseEnvelopeInterceptor} : le
 * corps renvoyé par le handler part tel quel (ex. `/metrics`, format
 * Prometheus texte, scrapé en prod — pas un client JSON de l'app).
 */
export const RawResponse = () => SetMetadata(IS_RAW_RESPONSE_KEY, true);
