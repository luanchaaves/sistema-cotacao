import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession, setAdminSessionCookie, signAdminToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { currentPassword, newEmail, newPassword, newName } = body;

    // Find current admin user
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: session.userId },
    });

    if (!adminUser) {
      return NextResponse.json({ error: 'Usuário administrador não localizado' }, { status: 404 });
    }

    // Verify current password
    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, adminUser.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: 'A senha atual informada está incorreta.' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Por favor, informe a senha atual para confirmar as alterações.' },
        { status: 400 }
      );
    }

    const updateData: {
      email?: string;
      name?: string;
      passwordHash?: string;
    } = {};

    if (newName && newName.trim()) {
      updateData.name = newName.trim();
    }

    if (newEmail && newEmail.trim() && newEmail.trim().toLowerCase() !== adminUser.email.toLowerCase()) {
      const emailTaken = await prisma.adminUser.findUnique({
        where: { email: newEmail.trim().toLowerCase() },
      });
      if (emailTaken && emailTaken.id !== adminUser.id) {
        return NextResponse.json(
          { error: 'Este e-mail já está sendo utilizado por outro administrador.' },
          { status: 400 }
        );
      }
      updateData.email = newEmail.trim().toLowerCase();
    }

    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 6) {
        return NextResponse.json(
          { error: 'A nova senha deve possuir no mínimo 6 caracteres.' },
          { status: 400 }
        );
      }
      updateData.passwordHash = await bcrypt.hash(newPassword.trim(), 10);
    }

    const updatedUser = await prisma.adminUser.update({
      where: { id: adminUser.id },
      data: updateData,
    });

    // Refresh session cookie
    const token = await signAdminToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      name: updatedUser.name,
    });
    await setAdminSessionCookie(token);

    return NextResponse.json({
      success: true,
      message: 'Credenciais administrativas atualizadas com sucesso!',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
      },
    });
  } catch (err: any) {
    console.error('Change admin credentials error:', err);
    return NextResponse.json(
      { error: 'Falha ao atualizar credenciais', details: err.message },
      { status: 500 }
    );
  }
}
