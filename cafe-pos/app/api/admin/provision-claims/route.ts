import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

const getDefaultTenantId = () =>
  process.env.NEXT_PUBLIC_TENANT_ID ?? process.env.DEFAULT_TENANT_ID ?? '';

const getDisplayName = (decoded: { name?: string; email?: string }) =>
  decoded.name ?? decoded.email?.split('@')[0] ?? 'Usuario';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization') ?? '';
  const tokenMatch = authHeader.match(/^Bearer (.+)$/);

  if (!tokenMatch) {
    return NextResponse.json({ error: 'Falta token de autorización.' }, { status: 401 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(tokenMatch[1]);
    const payload = await request.json().catch(() => ({}));
    const targetUid = (payload.uid as string | undefined) ?? decoded.uid;

    const isAdmin = decoded.role === 'admin';
    const isSelfProvision = targetUid === decoded.uid;

    if (!isSelfProvision && !isAdmin) {
      return NextResponse.json({ error: 'No autorizado para asignar claims.' }, { status: 403 });
    }

    const requestedTenantId = payload.tenantId as string | undefined;
    let tenantId = '';

    if (isSelfProvision) {
      if (requestedTenantId && requestedTenantId !== decoded.tenantId) {
        return NextResponse.json(
          { error: 'No autorizado para asignar claims de otro tenant.' },
          { status: 403 }
        );
      }

      tenantId = decoded.tenantId ?? getDefaultTenantId();
    } else {
      tenantId = requestedTenantId ?? getDefaultTenantId();
    }

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant no configurado.' }, { status: 400 });
    }

    const userRef = adminDb.doc(`tenants/${tenantId}/users/${targetUid}`);
    const userSnap = await userRef.get();

    let role = 'waiter';
    let resolvedTenantId = tenantId;

    if (userSnap.exists) {
      const data = userSnap.data() as { role?: string; tenantId?: string };
      role = data.role ?? role;
      resolvedTenantId = data.tenantId ?? resolvedTenantId;
    } else if (targetUid === decoded.uid) {
      await userRef.set(
        {
          displayName: getDisplayName(decoded),
          email: decoded.email ?? '',
          role,
          isActive: true,
          tenantId,
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    await adminAuth.setCustomUserClaims(targetUid, {
      tenantId: resolvedTenantId,
      role,
    });

    return NextResponse.json({
      uid: targetUid,
      tenantId: resolvedTenantId,
      role,
    });
  } catch (error) {
    console.error('Error provisioning claims:', error);
    return NextResponse.json({ error: 'No se pudo asignar claims.' }, { status: 500 });
  }
}
