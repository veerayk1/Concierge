/**
 * Know Your Residents — Leaderboard API
 *
 * GET — Returns the leaderboard sorted by high score descending,
 *        then by average time ascending (faster is better).
 *        Includes the requesting user's personal best stats.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // Fetch leaderboard sorted by score desc, then avgTimeMs asc
    const entries = await prisma.kyrLeaderboard.findMany({
      where: { propertyId },
      orderBy: [{ highScore: 'desc' }, { avgTimeMs: 'asc' }],
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Build ranked response
    const data = entries.map(
      (
        entry: {
          userId: string;
          highScore: number;
          bestStreak: number;
          totalGames: number;
          avgTimeMs: number;
          user: { firstName: string; lastName: string; avatarUrl: string | null };
        },
        index: number,
      ) => ({
        rank: index + 1,
        userId: entry.userId,
        userName: `${entry.user.firstName} ${entry.user.lastName}`,
        avatarUrl: entry.user.avatarUrl,
        highScore: entry.highScore,
        bestStreak: entry.bestStreak,
        totalGames: entry.totalGames,
        avgTimeMs: entry.avgTimeMs,
      }),
    );

    // Fetch personal best for the requesting user
    const personalBest = await prisma.kyrLeaderboard.findUnique({
      where: {
        userId_propertyId: {
          userId: auth.user.userId,
          propertyId,
        },
      },
    });

    return NextResponse.json({
      data,
      personalBest: personalBest
        ? {
            highScore: personalBest.highScore,
            bestStreak: personalBest.bestStreak,
            totalGames: personalBest.totalGames,
            avgTimeMs: personalBest.avgTimeMs,
          }
        : null,
    });
  } catch (error) {
    console.error('GET /api/v1/training/know-your-residents/leaderboard error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch leaderboard' },
      { status: 500 },
    );
  }
}
