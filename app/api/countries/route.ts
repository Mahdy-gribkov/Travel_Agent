import { NextRequest, NextResponse } from 'next/server';

import { withQueryValidation } from '@/lib/middleware/validation';
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
  return withQueryValidation(
    countriesQuerySchema,
    async (req, queryData) => {
      return withAuth(
        req,
        async (authReq, token) => {
          try {
            const { action, query, code, region, subregion, capital, language, currency, continent } = queryData;
            const countriesService = new CountriesService();

            let countries = [];

            switch (action) {
              case 'search':
                if (!query) {
                  return NextResponse.json(
                    { success: false, error: 'Query parameter is required for search' },
                    { status: 400 }
                  );
                }
                countries = await countriesService.searchCountries(query);
                break;

              case 'region':
                if (!region) {
                  return NextResponse.json(
                    { success: false, error: 'Region parameter is required' },
                    { status: 400 }
                  );
                }
                countries = await countriesService.getCountriesByRegion(region);
                break;

              case 'subregion':
                if (!subregion) {
                  return NextResponse.json(
                    { success: false, error: 'Subregion parameter is required' },
                    { status: 400 }
                  );
                }
                countries = await countriesService.getCountriesBySubregion(subregion);
                break;

              case 'capital':
                if (!capital) {
                  return NextResponse.json(
                    { success: false, error: 'Capital parameter is required' },
                    { status: 400 }
                  );
                }
                countries = await countriesService.getCountriesByCapital(capital);
                break;

              case 'language':
                if (!language) {
                  return NextResponse.json(
                    { success: false, error: 'Language parameter is required' },
                    { status: 400 }
                  );
                }
                countries = await countriesService.getCountriesByLanguage(language);
                break;

              case 'currency':
                if (!currency) {
                  return NextResponse.json(
                    { success: false, error: 'Currency parameter is required' },
                    { status: 400 }
                  );
                }
                countries = await countriesService.getCountriesByCurrency(currency);
                break;

              case 'popular':
                countries = await countriesService.getPopularDestinations();
                break;

              case 'continent':
                if (!continent) {
                  return NextResponse.json(
                    { success: false, error: 'Continent parameter is required' },
                    { status: 400 }
                  );
                }
                countries = await countriesService.getCountriesByContinent(continent);
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
                searchParams: {
                  action,
                  query,
                  code,
                  region,
                  subregion,
                  capital,
                  language,
                  currency,
                  continent,
                },
                totalResults: countries.length,
              },
              message: `Found ${countries.length} countries`,
            });
          } catch (error) {
            console.error('Error fetching countries:', error);
            return NextResponse.json(
              { success: false, error: 'Failed to fetch countries data' },
              { status: 500 }
            );
          }
        }
      );
    }
  );
}

// GET single country by code
export async function POST(request: NextRequest) {
  return withAuth(
    request,
    async (authReq, token) => {
      try {
        const body = await request.json();
        const { code } = body;

        if (!code) {
          return NextResponse.json(
            { success: false, error: 'Country code is required' },
            { status: 400 }
          );
        }

        const countriesService = new CountriesService();
        const country = await countriesService.getCountryByCode(code);

        if (!country) {
          return NextResponse.json(
            { success: false, error: 'Country not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: country,
          message: `Country data for ${country.name.common}`,
        });
      } catch (error) {
        console.error('Error fetching country by code:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch country data' },
          { status: 500 }
        );
      }
    }
  );
}
