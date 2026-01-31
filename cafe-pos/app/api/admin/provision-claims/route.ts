import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

const getDefaultTenantId = () =>
  process.env.NEXT_PUBLIC_TENANT_ID ?? process.env.DEFAULT_TENANT_ID ?? '';

const getDisplayName = (decoded: { name?: string; email?: string }) =>
  decoded.name ?? decoded.email?.split('@')[0] ?? 'Usuario';

const getMissingAdminEnv = () => {
  const requiredVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
  ];

  return requiredVars.filter((name) => !process.env[name]);
};

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization') ?? '';
  const tokenMatch = authHeader.match(/^Bearer (.+)$/);

  if (!tokenMatch) {
    return NextResponse.json({ error: 'Falta token de autorización.' }, { status: 401 });
  }

  try {
    const missingEnv = getMissingAdminEnv();
    if (missingEnv.length > 0) {
      return NextResponse.json(
        {
          error: `Configuración de Firebase Admin incompleta. Faltan: ${missingEnv.join(', ')}.`,
        },
        { status: 500 }
      );
    }

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
    const errorCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: string }).code)
        : 'unknown';
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: string }).message)
        : 'Error desconocido.';

    console.error('Error provisioning claims:', {
      code: errorCode,
      message: errorMessage,
    });

    if (errorCode === 'auth/insufficient-permission') {
      return NextResponse.json(
        { error: 'Permisos insuficientes para asignar claims.' },
        { status: 403 }
      );
    }

    if (errorCode === 'auth/argument-error') {
      return NextResponse.json(
        { error: 'Solicitud inválida para asignar claims.' },
        { status: 400 }
      );
    }

    if (errorCode === 'app/invalid-credential' || errorCode === 'app/no-app') {
      return NextResponse.json(
        { error: 'Credenciales de Firebase Admin inválidas o faltantes.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ error: 'No se pudo asignar claims.' }, { status: 500 });
  }
}
