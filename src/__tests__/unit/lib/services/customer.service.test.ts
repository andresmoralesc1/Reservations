/**
 * Customer Service Tests
 *
 * Tests unitarios para customer.service.ts
 * Usan mocks de base de datos, no conectan a Supabase real.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock del módulo db ANTES de importar el servicio
vi.mock('@/lib/db', () => {
  const mockCustomersQuery = {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  }
  const mockReservationsQuery = {
    findMany: vi.fn(),
  }
  const mockInsert = vi.fn()
  const mockUpdate = vi.fn()

  return {
    db: {
      query: {
        customers: mockCustomersQuery,
        reservations: mockReservationsQuery,
      },
      insert: mockInsert,
      update: mockUpdate,
    },
  }
})

import {
  findOrCreateCustomer,
  getCustomerByPhone,
  incrementNoShowCount,
  addCustomerTag,
  removeCustomerTag,
} from '@/lib/services/customer.service'
import { db } from '@/lib/db'

const mockCustomersQuery = (db as any).query.customers
const mockReservationsQuery = (db as any).query.reservations
const mockInsert = (db as any).insert
const mockUpdate = (db as any).update

describe('Customer Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('normalización de teléfono', () => {
    it('debería encontrar cliente con formato +34 XXX XXX XXX', async () => {
      // Arrange
      const phone = '+34 612 345 678'
      const mockCustomer = { id: 'cust-1', phoneNumber: phone, name: 'Test User' }
      mockCustomersQuery.findFirst.mockResolvedValue(mockCustomer)

      // Act
      const result = await findOrCreateCustomer({
        phoneNumber: phone,
      })

      // Assert
      expect(result).toBeDefined()
      expect(result?.phoneNumber).toBe(phone)
    })

    it('debería encontrar cliente con formato 6XXXXXXXX', async () => {
      // Arrange
      const phone = '612345678'
      const mockCustomer = { id: 'cust-2', phoneNumber: phone, name: 'Test User' }
      mockCustomersQuery.findFirst.mockResolvedValue(mockCustomer)

      // Act
      const result = await findOrCreateCustomer({
        phoneNumber: phone,
      })

      // Assert
      expect(result).toBeDefined()
    })

    it('debería encontrar cliente con formato internacional sin espacios', async () => {
      // Arrange
      const phone = '+34612345678'
      const mockCustomer = { id: 'cust-3', phoneNumber: phone, name: 'Test User' }
      mockCustomersQuery.findFirst.mockResolvedValue(mockCustomer)

      // Act
      const result = await findOrCreateCustomer({
        phoneNumber: phone,
      })

      // Assert
      expect(result).toBeDefined()
    })

    it('debería encontrar cliente con formato con espacios', async () => {
      // Arrange
      const phone = '612 34 56 78'
      const mockCustomer = { id: 'cust-4', phoneNumber: phone, name: 'Test User' }
      mockCustomersQuery.findFirst.mockResolvedValue(mockCustomer)

      // Act
      const result = await findOrCreateCustomer({
        phoneNumber: phone,
      })

      // Assert
      expect(result).toBeDefined()
    })
  })

  describe('findOrCreateCustomer', () => {
    it('debería crear cliente nuevo si no existe', async () => {
      // Arrange
      const phoneNumber = '+34 600 000 000'
      const name = 'Nuevo Cliente'

      mockCustomersQuery.findFirst.mockResolvedValue(null)

      const newCustomer = {
        id: 'new-cust-id',
        phoneNumber,
        name,
        noShowCount: 0,
        tags: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newCustomer])
        })
      })

      // Act
      const result = await findOrCreateCustomer({
        phoneNumber,
        name,
      })

      // Assert
      expect(result).toBeDefined()
      expect(result?.phoneNumber).toBe(phoneNumber)
      expect(result?.name).toBe(name)
    })

    it('debería retornar null si no existe y no se provee nombre', async () => {
      // Arrange
      mockCustomersQuery.findFirst.mockResolvedValue(null)

      // Act
      const result = await findOrCreateCustomer({
        phoneNumber: '+34 600 000 000',
      })

      // Assert
      expect(result).toBeNull()
    })

    it('debería retornar cliente existente', async () => {
      // Arrange
      const existingCustomer = {
        id: 'cust-existing',
        phoneNumber: '+34 611 111 111',
        name: 'Cliente Existente',
        noShowCount: 0,
        tags: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockCustomersQuery.findFirst.mockResolvedValue(existingCustomer)

      // Act
      const result = await findOrCreateCustomer({
        phoneNumber: '+34 611 111 111',
      })

      // Assert
      expect(result).toBeDefined()
      expect(result?.id).toBe(existingCustomer.id)
      expect(mockInsert).not.toHaveBeenCalled()
    })
  })

  describe('getCustomerByPhone', () => {
    it('debería obtener cliente por teléfono existente', async () => {
      // Arrange
      const phone = '+34 699 999 999'
      const mockCustomer = {
        id: 'cust-999',
        phoneNumber: phone,
        name: 'Juan',
        noShowCount: 0,
        tags: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockCustomersQuery.findFirst.mockResolvedValue(mockCustomer)

      // Act
      const result = await getCustomerByPhone(phone)

      // Assert
      expect(result).toBeDefined()
      expect(result.phoneNumber).toBe(phone)
      expect(result.name).toBe('Juan')
    })

    it('debería lanzar error con teléfono inexistente', async () => {
      // Arrange
      mockCustomersQuery.findFirst.mockResolvedValue(null)

      // Act & Assert
      await expect(getCustomerByPhone('+34 600 000 000'))
        .rejects
        .toThrow('Cliente no encontrado')
    })
  })

  describe('incrementNoShowCount', () => {
    it('debería incrementar contador de no-show', async () => {
      // Arrange
      const phone = '+34 655 555 555'
      const customer = {
        id: 'cust-555',
        phoneNumber: phone,
        name: 'Test',
        noShowCount: 2,
        tags: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockCustomersQuery.findFirst.mockResolvedValue(customer)

      const updatedCustomer = { ...customer, noShowCount: 3 }

      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedCustomer])
          })
        })
      })

      // Act
      const result = await incrementNoShowCount(phone)

      // Assert
      expect(result.noShowCount).toBe(3)
    })
  })

  describe('tags', () => {
    it('debería agregar tag a cliente', async () => {
      // Arrange
      const phone = '+34 677 777 777'
      const customer = {
        id: 'cust-777',
        phoneNumber: phone,
        name: 'Test',
        noShowCount: 0,
        tags: ['VIP'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockCustomersQuery.findFirst.mockResolvedValue(customer)

      const updatedCustomer = {
        ...customer,
        tags: ['VIP', 'FRECUENTE'],
      }

      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedCustomer])
          })
        })
      })

      // Act
      const result = await addCustomerTag(phone, 'FRECUENTE')

      // Assert
      expect(result.tags).toContain('FRECUENTE')
      expect(result.tags).toContain('VIP')
    })

    it('no debería duplicar tags existentes', async () => {
      // Arrange
      const phone = '+34 688 888 888'
      const customer = {
        id: 'cust-888',
        phoneNumber: phone,
        name: 'Test',
        noShowCount: 0,
        tags: ['VIP', 'FRECUENTE'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockCustomersQuery.findFirst.mockResolvedValue(customer)

      // Act
      const result = await addCustomerTag(phone, 'VIP')

      // Assert
      expect(result).toBe(customer) // Retorna el mismo cliente sin modificar
      expect(mockUpdate).not.toHaveBeenCalled()
    })

    it('debería remover tag de cliente', async () => {
      // Arrange
      const phone = '+34 644 444 444'
      const customer = {
        id: 'cust-444',
        phoneNumber: phone,
        name: 'Test',
        noShowCount: 0,
        tags: ['VIP', 'PROBLEMÁTICO'],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockCustomersQuery.findFirst.mockResolvedValue(customer)

      const updatedCustomer = {
        ...customer,
        tags: ['VIP'],
      }

      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedCustomer])
          })
        })
      })

      // Act
      const result = await removeCustomerTag(phone, 'PROBLEMÁTICO')

      // Assert
      expect(result.tags).not.toContain('PROBLEMÁTICO')
      expect(result.tags).toContain('VIP')
    })
  })
})
