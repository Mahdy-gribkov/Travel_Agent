import { NextRequest, NextResponse } from 'next/server';
import { CountriesService } from '@/services/external/countries.service';
import { z } from 'zod';

const countriesQuerySchema = z.object({
  action: z.enum(['all', 'search', 'region', 'subregion', 'capital', 'language', 'currency', 'popular', 'continent']).default('all'),
  query: z.string().optional(),
  code: z.string().optional(),
  region: z.string().optional(),
  subregion: z.string().optional(),
  capital: z.string().optional(),
  language: z.string().optional(),
  currency: z.string().optional(),
  continent: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'all';
    const query = url.searchParams.get('query');
    const code = url.searchParams.get('code');
    const region = url.searchParams.get('region');
    const subregion = url.searchParams.get('subregion');
    const capital = url.searchParams.get('capital');
    const language = url.searchParams.get('language');
    const currency = url.searchParams.get('currency');
    const continent = url.searchParams.get('continent');

    // Validate query parameters
    const queryData = countriesQuerySchema.parse({
      action,
      query,
      code,
      region,
      subregion,
      capital,
      language,
      currency,
      continent,
    });

    const { action: validatedAction, query: validatedQuery, code: validatedCode, region: validatedRegion, subregion: validatedSubregion, capital: validatedCapital, language: validatedLanguage, currency: validatedCurrency, continent: validatedContinent } = queryData;
    
    const countriesService = new CountriesService();
    let countries = [];

    switch (validatedAction) {
      case 'search':
        if (!validatedQuery) {
          return NextResponse.json(
            { success: false, error: 'Query parameter is required for search' },
            { status: 400 }
          );
        }
        countries = await countriesService.searchCountries(validatedQuery);
        break;

      case 'region':
        if (!validatedRegion) {
          return NextResponse.json(
            { success: false, error: 'Region parameter is required' },
            { status: 400 }
          );
        }
        countries = await countriesService.getCountriesByRegion(validatedRegion);
        break;

      case 'subregion':
        if (!validatedSubregion) {
          return NextResponse.json(
            { success: false, error: 'Subregion parameter is required' },
            { status: 400 }
          );
        }
        countries = await countriesService.getCountriesBySubregion(validatedSubregion);
        break;

      case 'capital':
        if (!validatedCapital) {
          return NextResponse.json(
            { success: false, error: 'Capital parameter is required' },
            { status: 400 }
          );
        }
        countries = await countriesService.getCountriesByCapital(validatedCapital);
        break;

      case 'language':
        if (!validatedLanguage) {
          return NextResponse.json(
            { success: false, error: 'Language parameter is required' },
            { status: 400 }
          );
        }
        countries = await countriesService.getCountriesByLanguage(validatedLanguage);
        break;

      case 'currency':
        if (!validatedCurrency) {
          return NextResponse.json(
            { success: false, error: 'Currency parameter is required' },
            { status: 400 }
          );
        }
        countries = await countriesService.getCountriesByCurrency(validatedCurrency);
        break;

      case 'popular':
        countries = await countriesService.getPopularDestinations();
        break;

      case 'continent':
        if (!validatedContinent) {
          return NextResponse.json(
            { success: false, error: 'Continent parameter is required' },
            { status: 400 }
          );
        }
        countries = await countriesService.getCountriesByContinent(validatedContinent);
        break;

      case 'all':
      default:
        countries = await countriesService.getAllCountries();
        break;
    }

    return NextResponse.json({
      success: true,
      data: {
        countries,
        total: countries.length,
        action: validatedAction,
        filters: {
          query: validatedQuery,
          region: validatedRegion,
          subregion: validatedSubregion,
          capital: validatedCapital,
          language: validatedLanguage,
          currency: validatedCurrency,
          continent: validatedContinent,
        },
      },
      message: 'Countries data retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch countries data' },
      { status: 500 }
    );
  }
}