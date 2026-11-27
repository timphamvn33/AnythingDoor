const test = require('node:test');
const assert = require('node:assert/strict');
const { Prisma, PrismaClient } = require('../../db/generated/prisma');
const { serializeDecimals } = require('../dist/prisma/decimal-response.interceptor.js');
const { OrderService } = require('../dist/orders/order.service.js');

test('decimal API values remain numbers, including nested values', () => {
  const date = new Date('2026-01-01T00:00:00Z');
  const result = serializeDecimals({
    price: new Prisma.Decimal('12.50'),
    items: [{ total: new Prisma.Decimal('0.30'), date }],
  });
  assert.deepEqual(result, { price: 12.5, items: [{ total: 0.3, date }] });
  assert.equal(result.items[0].date, date);
  assert.equal(
    JSON.stringify(result),
    '{"price":12.5,"items":[{"total":0.3,"date":"2026-01-01T00:00:00.000Z"}]}',
  );
});

test('adding an item calculates its total using decimal arithmetic', async () => {
  let total;
  const prisma = {
    order: {
      findFirst: async () => ({ id: 'order', total: new Prisma.Decimal('0.10') }),
      update: async ({ data }) => {
        total = data.total;
      },
    },
    orderItem: {
      create: async () => ({ price: new Prisma.Decimal('0.10'), quantity: 2 }),
    },
  };
  await new OrderService(prisma).initOrAddItem('user', { quantity: 2 });
  assert.equal(total.toString(), '0.3');
});

test(
  'owner records are restaurant-scoped and enforce basic constraints',
  {
    skip: !process.env.TEST_DATABASE_URL,
  },
  async () => {
    const prisma = new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL });
    const rollback = new Error('rollback test transaction');
    try {
      await assert.rejects(
        prisma.$transaction(async tx => {
          const restaurant = await tx.restaurant.create({
            data: { name: 'Test', logoUrl: '', category: [], openHrs: '09:00', closeHrs: '17:00' },
          });
          const employee = await tx.employee.create({
            data: {
              restaurantId: restaurant.id,
              name: 'Test employee',
              email: 'test@example.invalid',
              payType: 'hourly',
              payRate: '15.25',
            },
          });
          await tx.expense.create({
            data: {
              restaurantId: restaurant.id,
              category: 'rent',
              amount: '100.15',
              incurredAt: new Date(),
            },
          });
          await tx.workShift.create({ data: { employeeId: employee.id, clockIn: new Date() } });
          const saved = await tx.restaurant.findUnique({
            where: { id: restaurant.id },
            include: { expenses: true, employees: { include: { shifts: true } } },
          });
          assert.equal(saved.expenses[0].amount.toString(), '100.15');
          assert.equal(saved.employees[0].shifts.length, 1);
          throw rollback;
        }),
        error => error === rollback,
      );

      await assert.rejects(
        prisma.$transaction(async tx => {
          const restaurant = await tx.restaurant.create({
            data: { name: 'Test', logoUrl: '', category: [], openHrs: '09:00', closeHrs: '17:00' },
          });
          await tx.expense.create({
            data: {
              restaurantId: restaurant.id,
              category: 'rent',
              amount: '-1',
              incurredAt: new Date(),
            },
          });
        }),
        error => {
          assert.match(error.message, /Expense_amount_check/);
          return true;
        },
      );

      await assert.rejects(
        prisma.$transaction(async tx => {
          const user = await tx.user.create({
            data: {
              name: 'Test',
              email: 'owner-test@example.invalid',
              password: 'not-a-real-password',
            },
          });
          await tx.order.create({
            data: { userId: user.id, status: 'pending', total: 0, submittedAt: new Date() },
          });
        }),
        error => {
          assert.match(error.message, /Order_submitted_restaurant_check/);
          return true;
        },
      );
    } finally {
      await prisma.$disconnect();
    }
  },
);
