import { getVectorStore, VectorItem } from '@/lib/vector/pinecone';
import { adminDb } from '@/lib/firebase/admin';

export interface Document {
  id: string;
  content: string;
  metadata: Record<string, any>;
}

export class IngestionService {
  private vectorStore = getVectorStore();

  constructor() {
    // Initialize Pinecone on construction
    this.vectorStore.init().catch(console.error);
  }

  async ingestSampleData(): Promise<void> {
    console.log('Starting sample data ingestion...');

    const sampleDocuments: Document[] = [
      {
        id: 'tokyo_guide_1',
        content: `Tokyo Travel Guide

Tokyo, Japan's bustling capital, is a fascinating blend of traditional culture and cutting-edge technology. Here's everything you need to know for your visit.

Top Attractions:
1. Senso-ji Temple - Tokyo's oldest temple in Asakusa
2. Tokyo Skytree - Modern broadcasting tower with observation decks
3. Meiji Shrine - Peaceful shrine dedicated to Emperor Meiji
4. Tsukiji Outer Market - Famous fish market (inner market moved to Toyosu)
5. Shibuya Crossing - World's busiest pedestrian crossing

Best Areas to Stay:
- Shibuya: Modern, trendy area with great nightlife
- Shinjuku: Business district with excellent transport links
- Asakusa: Traditional area with historic temples
- Ginza: Upscale shopping and dining district

Transportation:
- JR Yamanote Line connects major districts
- Tokyo Metro and Toei Subway for local travel
- Suica or Pasmo cards for easy payment
- Taxis are expensive but available 24/7

Food Recommendations:
- Ramen: Ichiran, Ippudo, or local ramen shops
- Sushi: Tsukiji Outer Market or high-end omakase
- Tempura: Tempura Kondo or Daikokuya
- Street food: Takeshita Street in Harajuku

Cultural Tips:
- Remove shoes when entering homes and some restaurants
- Bow when greeting people
- Learn basic Japanese phrases
- Carry cash as many places don't accept cards
- Be quiet on public transportation

Best Time to Visit:
- Spring (March-May): Cherry blossom season
- Autumn (September-November): Pleasant weather and fall colors
- Summer: Hot and humid but fewer crowds
- Winter: Cool and dry, good for indoor activities

Budget Tips:
- Use JR Pass for long-distance travel
- Eat at convenience stores (konbini) for cheap meals
- Stay in business hotels or hostels
- Visit free attractions like temples and parks
- Use free WiFi at convenience stores and cafes`,
        metadata: {
          title: 'Complete Tokyo Travel Guide',
          type: 'guide',
          location: 'Tokyo, Japan',
          tags: ['tokyo', 'japan', 'travel-guide', 'attractions', 'food', 'transportation'],
          source: 'travel-expert',
          createdAt: new Date(),
        },
      },
      {
        id: 'paris_attractions_1',
        content: `Paris Top Attractions and Activities

Paris, the City of Light, offers countless attractions and experiences. Here are the must-see destinations:

Iconic Landmarks:
1. Eiffel Tower - Symbol of Paris, best views from Trocadéro
2. Notre-Dame Cathedral - Gothic masterpiece (currently under restoration)
3. Arc de Triomphe - Monumental arch with city views
4. Sacré-Cœur - White basilica on Montmartre hill
5. Louvre Museum - World's largest art museum

Museums and Culture:
- Musée d'Orsay - Impressionist masterpieces
- Centre Pompidou - Modern and contemporary art
- Musée Rodin - Sculptures and gardens
- Musée Picasso - Extensive Picasso collection
- Opéra Garnier - Beautiful opera house

Neighborhoods to Explore:
- Marais: Historic district with trendy shops
- Saint-Germain-des-Prés: Literary and artistic quarter
- Montmartre: Bohemian area with artists and cafés
- Latin Quarter: Student area with bookshops
- Champs-Élysées: Famous avenue for shopping

Day Trips:
- Versailles Palace - Magnificent royal residence
- Giverny - Monet's garden and home
- Chartres - Gothic cathedral with stunning stained glass
- Fontainebleau - Renaissance palace and forest

Food Experiences:
- Croissants and pastries at local boulangeries
- Wine tasting in wine bars (caves à vin)
- Cheese shops (fromageries) for authentic French cheese
- Street markets for fresh produce
- Traditional bistros for classic French cuisine

Practical Information:
- Paris Museum Pass for multiple attractions
- Navigo Easy card for public transportation
- Free entry to many museums on first Sunday of month
- Book tickets online for popular attractions
- Learn basic French phrases for better experience

Best Photography Spots:
- Trocadéro for Eiffel Tower photos
- Pont Alexandre III for romantic shots
- Montmartre for artistic street scenes
- Seine riverbanks for classic Paris views
- Jardin du Luxembourg for peaceful moments`,
        metadata: {
          title: 'Paris Attractions and Activities Guide',
          type: 'guide',
          location: 'Paris, France',
          tags: ['paris', 'france', 'attractions', 'museums', 'landmarks', 'culture'],
          source: 'travel-expert',
          createdAt: new Date(),
        },
      },
      {
        id: 'sustainable_travel_tips',
        content: `Sustainable Travel Guide: Eco-Friendly Travel Tips

Travel responsibly and minimize your environmental impact with these sustainable travel practices:

Transportation:
- Choose direct flights when possible to reduce carbon emissions
- Use public transportation instead of taxis or rental cars
- Walk or cycle for short distances
- Consider train travel for medium distances
- Offset your carbon footprint through verified programs

Accommodation:
- Stay in eco-certified hotels and lodges
- Choose locally-owned accommodations
- Look for properties with green certifications (LEED, Green Key)
- Use energy-efficient practices (turn off lights, AC)
- Support hotels with water conservation programs

Dining:
- Eat at locally-owned restaurants
- Choose seasonal and locally-sourced ingredients
- Reduce meat consumption and try plant-based options
- Avoid single-use plastics and bring reusable containers
- Support restaurants that practice sustainable sourcing

Activities and Attractions:
- Visit eco-friendly attractions and national parks
- Choose activities that support local communities
- Avoid activities that harm wildlife or environment
- Participate in conservation programs
- Learn about local environmental challenges

Shopping:
- Buy locally-made products and crafts
- Avoid products made from endangered species
- Bring reusable shopping bags
- Support fair trade organizations
- Choose quality items that last longer

Cultural Respect:
- Learn about local customs and traditions
- Respect sacred sites and cultural heritage
- Support local artisans and cultural preservation
- Learn basic phrases in the local language
- Be mindful of cultural differences

Waste Reduction:
- Bring reusable water bottles and coffee cups
- Use biodegradable toiletries
- Minimize packaging waste
- Properly dispose of waste and recycling
- Leave no trace in natural areas

Water Conservation:
- Take shorter showers
- Reuse towels and linens
- Choose accommodations with water-saving features
- Be mindful of water usage in water-scarce areas
- Support water conservation projects

Energy Conservation:
- Turn off lights and electronics when not in use
- Use natural light and ventilation when possible
- Choose accommodations with renewable energy
- Support clean energy initiatives
- Be mindful of energy consumption

Community Support:
- Hire local guides and services
- Stay in locally-owned accommodations
- Eat at family-run restaurants
- Buy from local markets and artisans
- Support community development projects

Wildlife Protection:
- Observe wildlife from a safe distance
- Don't feed or touch wild animals
- Choose wildlife tours that prioritize animal welfare
- Avoid attractions that exploit animals
- Support wildlife conservation organizations

Environmental Education:
- Learn about local environmental issues
- Share knowledge about sustainable practices
- Support environmental education programs
- Choose tours that include environmental education
- Be an ambassador for sustainable travel

Remember: Sustainable travel is about making conscious choices that benefit the environment, local communities, and future generations. Every small action counts!`,
        metadata: {
          title: 'Sustainable Travel Guide',
          type: 'guide',
          location: 'Global',
          tags: ['sustainable-travel', 'eco-friendly', 'environment', 'responsible-travel', 'green-tourism'],
          source: 'sustainability-expert',
          createdAt: new Date(),
        },
      },
      {
        id: 'accessibility_travel_guide',
        content: `Accessible Travel Guide: Traveling with Disabilities

Travel should be accessible to everyone. Here's a comprehensive guide for travelers with disabilities:

Planning Your Trip:
- Research accessibility features at your destination
- Contact hotels and attractions in advance about accessibility
- Check airline policies for mobility equipment
- Consider travel insurance that covers pre-existing conditions
- Plan for extra time at airports and attractions

Transportation:
- Airlines: Request wheelchair assistance and accessible seating
- Trains: Many modern trains have accessible cars and facilities
- Buses: Check for wheelchair-accessible buses and routes
- Taxis: Look for accessible taxi services in major cities
- Car rentals: Some companies offer adapted vehicles

Accommodation:
- Look for hotels with accessible rooms and facilities
- Check for features like roll-in showers, grab bars, and wide doorways
- Verify elevator access and accessible common areas
- Consider location proximity to accessible transportation
- Read reviews from other travelers with disabilities

Attractions and Activities:
- Many museums and attractions offer accessibility features
- Check for audio guides, tactile exhibits, and sign language tours
- Look for accessible tours and experiences
- Some attractions offer free or discounted admission for caregivers
- Plan visits during less crowded times for easier navigation

Mobility Equipment:
- Research airline policies for mobility devices
- Consider renting equipment at your destination
- Bring spare parts and tools for repairs
- Check voltage compatibility for electric wheelchairs
- Have documentation for medical equipment

Communication:
- Learn basic sign language phrases if needed
- Use translation apps for communication
- Carry written information about your needs
- Consider hiring local guides who speak your language
- Use visual aids and written instructions

Medical Considerations:
- Bring extra medication and prescriptions
- Research medical facilities at your destination
- Consider travel insurance with medical coverage
- Carry medical documentation and emergency contacts
- Plan for medical equipment and supplies

Technology and Apps:
- Use accessibility apps for navigation and information
- Download offline maps and guides
- Use voice-to-text and text-to-speech features
- Consider wearable devices for safety and communication
- Use apps that provide accessibility information

Legal Rights:
- Know your rights under disability laws in different countries
- Understand airline and transportation accessibility requirements
- Be aware of accommodation accessibility standards
- Know how to file complaints if accessibility needs aren't met
- Research disability rights organizations in your destination

Financial Considerations:
- Some destinations offer discounts for travelers with disabilities
- Consider the cost of accessible transportation and accommodation
- Look for grants and funding for accessible travel
- Plan for potential additional costs of accessibility services
- Research travel insurance options

Support and Resources:
- Connect with disability travel communities and forums
- Use travel agents who specialize in accessible travel
- Contact disability organizations at your destination
- Join accessible travel groups and communities
- Share your experiences to help other travelers

Emergency Preparedness:
- Have emergency contacts and medical information readily available
- Know how to access emergency services in your destination
- Plan for evacuation procedures in case of emergency
- Consider personal emergency response systems
- Have backup plans for equipment failures

Remember: Traveling with disabilities requires extra planning, but it's absolutely possible and rewarding. Don't let accessibility challenges prevent you from exploring the world!`,
        metadata: {
          title: 'Accessible Travel Guide',
          type: 'guide',
          location: 'Global',
          tags: ['accessible-travel', 'disability', 'mobility', 'inclusive-travel', 'accessibility'],
          source: 'accessibility-expert',
          createdAt: new Date(),
        },
      },
    ];

    try {
      await this.upsertDocuments(sampleDocuments);
      console.log(`Successfully ingested ${sampleDocuments.length} sample documents`);
    } catch (error) {
      console.error('Error ingesting sample data:', error);
      throw error;
    }
  }

  async ingestItineraryData(itinerary: any): Promise<void> {
    try {
      const document: Document = {
        id: `itinerary_${itinerary.id}`,
        content: this.formatItineraryContent(itinerary),
        metadata: {
          title: itinerary.title,
          type: 'itinerary',
          location: itinerary.destination,
          tags: this.extractItineraryTags(itinerary),
          source: 'user-generated',
          createdAt: new Date(),
        },
      };

      await this.upsertDocuments([document]);
      console.log(`Successfully ingested itinerary: ${itinerary.title}`);
    } catch (error) {
      console.error('Error ingesting itinerary:', error);
      throw error;
    }
  }

  private formatItineraryContent(itinerary: any): string {
    let content = `Travel Itinerary: ${itinerary.title}\n\n`;
    content += `Destination: ${itinerary.destination}\n`;
    content += `Duration: ${itinerary.startDate} to ${itinerary.endDate}\n`;
    content += `Travelers: ${itinerary.travelers}\n`;
    content += `Budget: $${itinerary.budget}\n\n`;

    if (itinerary.days && itinerary.days.length > 0) {
      content += 'Daily Activities:\n\n';
      itinerary.days.forEach((day: any, index: number) => {
        content += `Day ${day.day} (${day.date}):\n`;
        if (day.activities && day.activities.length > 0) {
          day.activities.forEach((activity: any) => {
            content += `- ${activity.name}: ${activity.description}\n`;
            if (activity.location) {
              content += `  Location: ${activity.location.name}, ${activity.location.city}\n`;
            }
            if (activity.cost) {
              content += `  Cost: $${activity.cost}\n`;
            }
          });
        }
        content += '\n';
      });
    }

    if (itinerary.metadata && itinerary.metadata.tags) {
      content += `Tags: ${itinerary.metadata.tags.join(', ')}\n`;
    }

    return content;
  }

  private extractItineraryTags(itinerary: any): string[] {
    const tags = new Set<string>();
    
    tags.add(itinerary.destination.toLowerCase());
    tags.add('itinerary');
    
    if (itinerary.days) {
      itinerary.days.forEach((day: any) => {
        if (day.activities) {
          day.activities.forEach((activity: any) => {
            tags.add(activity.type);
            if (activity.location) {
              tags.add(activity.location.city.toLowerCase());
              tags.add(activity.location.country.toLowerCase());
            }
            if (activity.sustainability?.ecoFriendly) {
              tags.add('eco-friendly');
            }
            if (activity.accessibility?.wheelchairAccessible) {
              tags.add('accessible');
            }
          });
        }
      });
    }

    if (itinerary.metadata?.tags) {
      itinerary.metadata.tags.forEach((tag: string) => tags.add(tag));
    }

    return Array.from(tags);
  }

  async getIngestionStats(): Promise<any> {
    try {
      return await this.vectorStore.getIndexStats();
    } catch (error) {
      console.error('Error getting ingestion stats:', error);
      return { error: 'Failed to get stats' };
    }
  }

  /**
   * Upsert documents to Pinecone vector store
   */
  private async upsertDocuments(documents: Document[]): Promise<void> {
    const vectors: VectorItem[] = [];

    for (const doc of documents) {
      try {
        // Process the document content into chunks and generate embeddings
        const docVectors = await this.vectorStore.processText(
          doc.content,
          {
            ...doc.metadata,
            documentId: doc.id,
            originalContent: doc.content,
          }
        );
        vectors.push(...docVectors);
      } catch (error) {
        console.error(`Error processing document ${doc.id}:`, error);
        // Continue with other documents
      }
    }

    if (vectors.length > 0) {
      await this.vectorStore.upsertVectors(vectors);
    }
  }
}
