/**
 * Tests para useFilters.ts
 *
 * Hook para gestionar filtros y búsqueda de reservas.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFilters } from '@/app/admin/hooks/useFilters'
import type { Reservation } from '@/app/admin/types'

// Mock reservations data
const mockReservations: Reservation[] = [
  {
    id: '1',
    reservationCode: 'RES-A1B2C',
    customerName: 'Carlos García',
    customerPhone: '612345678',
    reservationDate: '2026-03-30',
    reservationTime: '20:00',
    partySize: 4,
    status: 'PENDIENTE',
    source: 'WEB',
    customerNoShowCount: 0,
    tableIds: ['table-1'],
    createdAt: '2026-03-30T10:00:00Z',
    updatedAt: '2026-03-30T10:00:00Z',
  },
  {
    id: '2',
    reservationCode: 'RES-D3E4F',
    customerName: 'María López',
    customerPhone: '623456789',
    reservationDate: '2026-03-30',
    reservationTime: '21:00',
    partySize: 2,
    status: 'CONFIRMADO',
    source: 'WHATSAPP',
    customerNoShowCount: 0,
    tableIds: ['table-2'],
    createdAt: '2026-03-30T10:00:00Z',
    updatedAt: '2026-03-30T10:00:00Z',
  },
  {
    id: '3',
    reservationCode: 'RES-G5H6I',
    customerName: 'Juan Martínez',
    customerPhone: '634567890',
    reservationDate: '2026-03-30',
    reservationTime: '20:30',
    partySize: 6,
    status: 'CANCELADO',
    source: 'IVR',
    customerNoShowCount: 0,
    tableIds: ['table-3'],
    createdAt: '2026-03-30T10:00:00Z',
    updatedAt: '2026-03-30T10:00:00Z',
  },
  {
    id: '4',
    reservationCode: 'RES-J7K8L',
    customerName: 'Ana Sánchez',
    customerPhone: '645678901',
    reservationDate: '2026-03-30',
    reservationTime: '22:00',
    partySize: 3,
    status: 'PENDIENTE',
    source: 'WEB',
    customerNoShowCount: 2, // Cliente con no-shows
    tableIds: ['table-4'],
    createdAt: '2026-03-30T10:00:00Z',
    updatedAt: '2026-03-30T10:00:00Z',
  },
  {
    id: '5',
    reservationCode: 'RES-M9N0O',
    customerName: 'Pedro Ruiz',
    customerPhone: '656789012',
    reservationDate: '2026-03-30',
    reservationTime: '19:00',
    partySize: 2,
    status: 'CONFIRMADO',
    source: 'MANUAL',
    customerNoShowCount: 0,
    tableIds: ['table-5'],
    createdAt: '2026-03-30T10:00:00Z',
    updatedAt: '2026-03-30T10:00:00Z',
  },
]

describe('useFilters', () => {
  it('debería retornar todas las reservas por defecto', () => {
    const { result } = renderHook(() => useFilters({ reservations: mockReservations }))

    expect(result.current.filteredReservations).toHaveLength(5)
    expect(result.current.filter).toBe('all')
  })

  it('debería filtrar por estado PENDIENTE', () => {
    const { result } = renderHook(() => useFilters({ reservations: mockReservations }))

    act(() => {
      result.current.setFilter('pending')
    })

    expect(result.current.filteredReservations).toHaveLength(2)
    expect(result.current.filteredReservations.every(r => r.status === 'PENDIENTE')).toBe(true)
  })

  it('debería filtrar por estado CONFIRMADO', () => {
    const { result } = renderHook(() => useFilters({ reservations: mockReservations }))

    act(() => {
      result.current.setFilter('confirmed')
    })

    expect(result.current.filteredReservations).toHaveLength(2)
    expect(result.current.filteredReservations.every(r => r.status === 'CONFIRMADO')).toBe(true)
  })

  it('debería filtrar por estado CANCELADO', () => {
    const { result } = renderHook(() => useFilters({ reservations: mockReservations }))

    act(() => {
      result.current.setFilter('cancelled')
    })

    expect(result.current.filteredReservations).toHaveLength(1)
    expect(result.current.filteredReservations[0].status).toBe('CANCELADO')
  })

  it('debería filtrar por no-shows (clientes con historial de no-show)', () => {
    const { result } = renderHook(() => useFilters({ reservations: mockReservations }))

    act(() => {
      result.current.setFilter('noShows')
    })

    expect(result.current.filteredReservations).toHaveLength(1)
    expect(result.current.filteredReservations[0].customerNoShowCount).toBeGreaterThan(0)
    expect(result.current.filteredReservations[0].reservationCode).toBe('RES-J7K8L')
  })

  describe('búsqueda', () => {
    it('debería buscar por nombre de cliente', () => {
      const { result } = renderHook(() => useFilters({ reservations: mockReservations }))

      act(() => {
        result.current.setSearchQuery('Carlos')
      })

      expect(result.current.filteredReservations).toHaveLength(1)
      expect(result.current.filteredReservations[0].customerName).toBe('Carlos García')
    })

    it('debería buscar por código de reserva', () => {
      const { result } = renderHook(() => useFilters({ reservations: mockReservations }))

      act(() => {
        result.current.setSearchQuery('D3E4F')
      })

      expect(result.current.filteredReservations).toHaveLength(1)
      expect(result.current.filteredReservations[0].reservationCode).toBe('RES-D3E4F')
    })

    it('debería buscar por teléfono', () => {
      const { result } = renderHook(() => useFilters({ reservations: mockReservations }))

      act(() => {
        result.current.setSearchQuery('634567890')
      })

      expect(result.current.filteredReservations).toHaveLength(1)
      expect(result.current.filteredReservations[0].customerPhone).toBe('634567890')
    })

    it('debería ser case-insensitive', () => {
      const { result } = renderHook(() => useFilters({ reservations: mockReservations }))

      act(() => {
        result.current.setSearchQuery('carlos')
      })

      expect(result.current.filteredReservations).toHaveLength(1)
    })

    it('debería retornar vacío si no hay coincidencias', () => {
      const { result } = renderHook(() => useFilters({ reservations: mockReservations }))

      act(() => {
        result.current.setSearchQuery('Inexistente')
      })

      expect(result.current.filteredReservations).toHaveLength(0)
    })
  })

  describe('combinación de filtros y búsqueda', () => {
    it('debería aplicar filtro y búsqueda simultáneamente', () => {
      const { result } = renderHook(() => useFilters({ reservations: mockReservations }))

      act(() => {
        result.current.setFilter('pending')
        result.current.setSearchQuery('Ana')
      })

      expect(result.current.filteredReservations).toHaveLength(1)
      expect(result.current.filteredReservations[0].customerName).toBe('Ana Sánchez')
      expect(result.current.filteredReservations[0].status).toBe('PENDIENTE')
    })

    it('debería resetear a página 1 al cambiar filtro', () => {
      const { result } = renderHook(() => useFilters({
        reservations: mockReservations,
        itemsPerPage: 2,
      }))

      act(() => {
        result.current.setCurrentPage(2)
      })
      expect(result.current.currentPage).toBe(2)

      act(() => {
        result.current.setFilter('confirmed')
      })
      expect(result.current.currentPage).toBe(1)
    })

    it('debería resetear a página 1 al cambiar búsqueda', () => {
      const { result } = renderHook(() => useFilters({
        reservations: mockReservations,
        itemsPerPage: 2,
      }))

      act(() => {
        result.current.setCurrentPage(2)
      })
      expect(result.current.currentPage).toBe(2)

      act(() => {
        result.current.setSearchQuery('Carlos')
      })
      expect(result.current.currentPage).toBe(1)
    })
  })

  describe('paginación', () => {
    it('debería paginar correctamente', () => {
      const { result } = renderHook(() => useFilters({
        reservations: mockReservations,
        itemsPerPage: 2,
      }))

      expect(result.current.totalPages).toBe(3)
      expect(result.current.paginatedReservations).toHaveLength(2)

      act(() => {
        result.current.setCurrentPage(2)
      })

      expect(result.current.paginatedReservations).toHaveLength(2)
      expect(result.current.paginatedReservations[0].id).toBe('3')
    })

    it('debería calcular páginas correctamente al filtrar', () => {
      const { result } = renderHook(() => useFilters({
        reservations: mockReservations,
        itemsPerPage: 2,
      }))

      act(() => {
        result.current.setFilter('pending')
      })

      expect(result.current.totalPages).toBe(1)
      expect(result.current.paginatedReservations).toHaveLength(2)
    })

    it('debería manejar itemsPerPage personalizado', () => {
      const { result } = renderHook(() => useFilters({
        reservations: mockReservations,
        itemsPerPage: 3,
      }))

      expect(result.current.totalPages).toBe(2)
      expect(result.current.paginatedReservations).toHaveLength(3)
    })
  })

  describe('resetFilters', () => {
    it('debería resetear todos los filtros', () => {
      const { result } = renderHook(() => useFilters({
        reservations: mockReservations,
        itemsPerPage: 2, // Necesario para tener múltiples páginas
      }))

      act(() => {
        result.current.setFilter('pending')
        result.current.setSearchQuery('Carlos')
        result.current.setCurrentPage(2) // Página válida (totalPages = 1 para pending, 3 para all)
      })

      expect(result.current.filter).toBe('pending')
      expect(result.current.searchQuery).toBe('Carlos')
      // Al filtrar por pending, totalPages = 1, así que currentPage se resetea a 1
      expect(result.current.currentPage).toBe(1)

      act(() => {
        result.current.resetFilters()
      })

      expect(result.current.filter).toBe('all')
      expect(result.current.searchQuery).toBe('')
      expect(result.current.currentPage).toBe(1)
    })
  })
})
