import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from './fixtures/auth.fixture';

function uniqueSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
}

function nextFutureBookableDate(): Date {
  const now = new Date();
  const candidate = new Date(now);
  candidate.setDate(candidate.getDate() + 1);

  if (candidate.getDay() === 0) {
    candidate.setDate(candidate.getDate() + 1);
  }

  return candidate;
}

async function getAuthHeaders(page: Page) {
  const token = await page.evaluate(() => localStorage.getItem('access_token'));

  expect(token).toBeTruthy();

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function preparePublicProvider(
  page: Page,
  request: APIRequestContext,
) {
  const headers = await getAuthHeaders(page);

  const profileResponse = await request.get('/api/profile/me', { headers });
  expect(profileResponse.ok()).toBeTruthy();
  const profile = await profileResponse.json();

  const serviceName = `Publico E2E ${uniqueSuffix()}`;

  const serviceResponse = await request.post('/api/services', {
    headers,
    data: {
      name: serviceName,
      description: 'Servico para fluxo publico',
      durationInMinutes: 30,
      priceInCents: 4500,
      isActive: true,
    },
  });
  expect(serviceResponse.ok()).toBeTruthy();
  const service = await serviceResponse.json();

  const days = [1, 2, 3, 4, 5, 6];

  for (const dayOfWeek of days) {
    const availabilityResponse = await request.post('/api/availability', {
      headers,
      data: {
        dayOfWeek,
        slots: [{ start: '09:00', end: '18:00' }],
      },
    });

    expect(availabilityResponse.ok()).toBeTruthy();
  }

  return {
    slug: profile.slug as string,
    serviceId: service.id as string,
    serviceName,
  };
}

test.describe('public', () => {
  test('pagina publica exige slug na URL', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Link de agendamento invalido', { exact: true })).toBeVisible();
    await expect(
      page.getByText('Use o link enviado pelo prestador para acessar os horarios disponiveis.', {
        exact: true,
      }),
    ).toBeVisible();
  });

  test('area publica de agendamentos nao preenche slug com fallback fixo', async ({ page }) => {
    await page.goto('/meus-agendamentos');

    await expect(page.getByPlaceholder('slug-do-negocio')).toHaveValue('');
  });

  test('cliente agenda horario via pagina publica', async ({ loginAsProfessional, page, request }) => {
    await loginAsProfessional();

    const provider = await preparePublicProvider(page, request);
    await page.goto(`/${provider.slug}`);

    await expect(page.getByRole('heading', { name: 'Escolha o serviço' })).toBeVisible();
    await page.getByRole('button', { name: new RegExp(provider.serviceName) }).click();

    const dayButton = page
      .locator('section')
      .filter({ hasText: 'Escolha a data e hora' })
      .locator('button:not([disabled])')
      .filter({ hasText: /^\d{1,2}$/ })
      .first();

    await expect(dayButton).toBeVisible();
    await dayButton.click();

    const slotButton = page
      .locator('button')
      .filter({ hasText: /^\d{2}:\d{2}$/ })
      .first();
    await expect(slotButton).toBeVisible();
    await slotButton.click();

    await page.getByLabel('Nome completo').fill('Cliente Publico E2E');
    await page.getByLabel('E-mail').fill(`cliente-${uniqueSuffix()}@test.com`);
    await page.getByLabel('WhatsApp / Telefone').fill('11999997777');

    await page.getByRole('button', { name: 'Confirmar' }).click();

    await expect(page.getByText('Agendamento confirmado!', { exact: true })).toBeVisible();
  });

  test('calendario publico desabilita dias fechados do prestador', async ({
    createProfessional,
    page,
    request,
  }) => {
    const credentials = await createProfessional({
      businessName: `Ingles Quartas ${uniqueSuffix()}`,
    });

    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: credentials.email,
        password: credentials.password,
      },
    });
    expect(loginResponse.ok()).toBeTruthy();
    const { access_token } = await loginResponse.json();

    const profileResponse = await request.get('/api/profile/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    expect(profileResponse.ok()).toBeTruthy();
    const profile = await profileResponse.json();

    const serviceResponse = await request.post('/api/services', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      data: {
        name: `Aula Quarta ${uniqueSuffix()}`,
        description: 'Servico com disponibilidade so na quarta',
        durationInMinutes: 30,
        priceInCents: 6000,
        isActive: true,
      },
    });
    expect(serviceResponse.ok()).toBeTruthy();
    const service = await serviceResponse.json();

    const availabilityResponse = await request.put('/api/availability/week', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      data: {
        availabilities: [
          {
            dayOfWeek: 3,
            slots: [{ start: '12:00', end: '14:00' }],
          },
        ],
      },
    });
    expect(availabilityResponse.ok()).toBeTruthy();

    await page.goto(`/${profile.slug}`);
    await page.getByRole('button', { name: new RegExp(service.name) }).click();

    const weekdayAvailability = await page.locator('.rdp-button').evaluateAll((buttons) => {
      return buttons
        .map((button) => ({
          label: button.getAttribute('aria-label') ?? '',
          disabled: button.hasAttribute('disabled') || button.getAttribute('aria-disabled') === 'true',
        }))
        .filter((button) => button.label);
    });

    expect(
      weekdayAvailability.some(
        (button) => button.label.toLowerCase().includes('segunda') && button.disabled,
      ),
    ).toBe(true);
    expect(
      weekdayAvailability.some(
        (button) => button.label.toLowerCase().includes('quarta') && !button.disabled,
      ),
    ).toBe(true);
  });

  test('url legada com query string redireciona para rota limpa do prestador', async ({ page }) => {
    await page.goto('/?slug=ingles-aulas');

    await expect(page).toHaveURL(/\/ingles-aulas$/);
  });

  test('cliente consulta e cancela agendamento em /meus-agendamentos', async ({ loginAsProfessional, page, request }) => {
    await loginAsProfessional();

    const provider = await preparePublicProvider(page, request);
    const headers = await getAuthHeaders(page);

    const startsAt = nextFutureBookableDate();
    startsAt.setHours(11, 0, 0, 0);

    const endsAt = new Date(startsAt);
    endsAt.setMinutes(endsAt.getMinutes() + 30);

    const customerPhone = '11999996666';

    const createAppointmentResponse = await request.post(
      `/api/public/${provider.slug}/schedule`,
      {
      data: {
        serviceId: provider.serviceId,
        customerName: 'Cliente Consulta E2E',
        customerEmail: `consulta-${uniqueSuffix()}@test.com`,
        customerPhone,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
      },
    });
    expect(createAppointmentResponse.ok()).toBeTruthy();

    await page.goto('/meus-agendamentos');

    await page.getByPlaceholder('slug-do-negocio').fill(provider.slug);
    await page.getByPlaceholder('(11) 99999-9999').fill(customerPhone);
    await page.getByRole('button', { name: 'Buscar Agendamentos' }).click();

    await expect(page.getByRole('heading', { name: 'Meus Agendamentos' })).toBeVisible();
    await expect(page.getByText(provider.serviceName)).toBeVisible();

    await page.getByRole('button', { name: 'Cancelar' }).first().click();
    await page.getByRole('button', { name: 'Sim, Cancelar' }).click();

    await expect(page.getByText('Agendamento cancelado com sucesso', { exact: true })).toBeVisible();
    await expect(page.getByText('Cancelado', { exact: true })).toBeVisible();
  });
});
