import { Injectable } from '@nestjs/common';
import { DatabaseContext } from '../../../infrastructure/database/database-context';
import { MediaReferenceChecker } from '../application/ports/media-reference.port';

/**
 * Contrôle SQL brut (pas d'ORM entity) — parcourt les tables connues pour
 * stocker une URL/hash IPFS : `brand_media`, `"user".avatar_url`,
 * `brand_application` (pas de user_id : rattachée par email de contact),
 * `event.cover_image_url`.
 */
@Injectable()
export class TypeOrmMediaReferenceRepository extends MediaReferenceChecker {
  constructor(private readonly db: DatabaseContext) {
    super();
  }

  async isReferencedByAnotherUser(
    cid: string,
    userId: string,
  ): Promise<boolean> {
    const rows = await this.db.manager.query<{ exists: boolean }[]>(
      `SELECT EXISTS (
         SELECT 1 FROM brand_media bm
         JOIN brand b ON b.id = bm.brand_id
         WHERE bm.ipfs_hash = $1 AND b.user_id != $2

         UNION

         SELECT 1 FROM "user" u
         WHERE u.avatar_url LIKE '%' || $1 || '%' AND u.id != $2

         UNION

         SELECT 1 FROM brand_application ba
         WHERE (ba.logo_url LIKE '%' || $1 || '%'
                OR ba.registration_proof_url LIKE '%' || $1 || '%')
           AND ba.contact_email != (SELECT email FROM "user" WHERE id = $2)

         UNION

         SELECT 1 FROM event e
         JOIN brand b ON b.id = e.brand_id
         WHERE e.cover_image_url LIKE '%' || $1 || '%' AND b.user_id != $2
       ) AS "exists"`,
      [cid, userId],
    );
    return rows[0]?.exists ?? false;
  }
}
