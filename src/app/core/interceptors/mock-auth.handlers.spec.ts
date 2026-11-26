import { HttpRequest, HttpResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { User } from '../models/auth.model';
import { MOCK_USERS } from '../services/mock-data';
import { createJwt, decodeJwt } from '../utils/jwt.util';
import { handleMockAuthRequest } from './mock-auth.handlers';

describe('mock auth handlers: additional users', () => {
  it.each([
    { email: 'sujata.karki@aurapay.np', id: 'usr-sales-02', role: 'SALES' },
    { email: 'jeshan.joshi@aurapay.np', id: 'usr-rev-02', role: 'REVIEWER' },
  ])('authenticates $role users by email', async ({ email, id, role }) => {
    const request = new HttpRequest('POST', '/auth/login', {
      email,
      password: 'Password123!',
    });

    const response = await firstValueFrom(handleMockAuthRequest(request)!);
    const body = (response as HttpResponse<{ user: User }>).body!;

    expect(body.user.id).toBe(id);
    expect(body.user.role).toBe(role);
  });

  it('preserves Sujata Karki as the user when refreshing her session', async () => {
    const sujata = MOCK_USERS.SALES[1];
    const request = new HttpRequest('POST', '/auth/refresh', {
      refreshToken: createJwt({ sub: sujata.id, type: 'refresh' }, 86400),
    });

    const response = await firstValueFrom(handleMockAuthRequest(request)!);
    const body = (response as HttpResponse<{ accessToken: string }>).body!;
    const claims = decodeJwt<{ sub: string; name: string; assignedMerchantIds: string[] }>(
      body.accessToken
    );

    expect(claims?.sub).toBe(sujata.id);
    expect(claims?.name).toBe(sujata.name);
    expect(claims?.assignedMerchantIds).toEqual(sujata.assignedMerchantIds);
  });
});
