import { ArrowRight, SlidersHorizontal, X } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { RestaurantCard } from '@/components/restaurant-card'
import { EmptyState } from '@/components/feedback'
import { categories, restaurantPresentation } from '@/lib/presentation'
import { useFavorites } from '@/lib/favorites'
import { sampleRestaurants } from '@/lib/sample-data'
import { cn } from '@/lib/utils'

export function DiscoverPage({ savedOnly = false }: { savedOnly?: boolean }) {
  const { ids } = useFavorites()
  const [params, setParams] = useSearchParams()
  const search = params.get('q')?.trim().toLowerCase() || ''
  const category = params.get('category') || 'All'
  const sort = params.get('sort') || 'recommended'
  const filtered = sampleRestaurants
    .filter((restaurant) => {
      if (savedOnly && !ids.includes(restaurant.id)) return false
      const menus = restaurant.menu_items
      const meta = restaurantPresentation(restaurant, menus)
      if (category !== 'All' && meta.cuisine !== category) return false
      return (
        !search ||
        `${restaurant.name} ${meta.description} ${meta.cuisine} ${(menus ?? []).map((item) => item.name).join(' ')}`
          .toLowerCase()
          .includes(search)
      )
    })
    .sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : 0))
  function updateParam(key: string, value: string) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (value && value !== 'All' && value !== 'recommended') next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  }
  return (
    <div className="page-content discover-page">
      <div className="page-intro">
        <div>
          <h1>
            {savedOnly
              ? 'Saved restaurants'
              : search
                ? 'Search results for “' + params.get('q') + '”'
                : 'What are you craving?'}
          </h1>
          <p>
            {savedOnly
              ? 'Your favorites, ready when you are.'
              : search
                ? 'Restaurants and dishes matching your search.'
                : 'Find a restaurant. Choose your favorites. Enjoy your meal.'}
          </p>
        </div>
      </div>
      <section className="cuisine-section" aria-label="Browse by cuisine">
        <div className="category-list">
          {categories.map((item) => (
            <button
              key={item.name}
              className={cn('category-button', category === item.name && 'selected')}
              aria-pressed={category === item.name}
              onClick={() => updateParam('category', item.name)}
            >
              {item.name === 'All' ? 'All cuisines' : item.name}
            </button>
          ))}
        </div>
      </section>
      <section
        id="restaurants"
        className="restaurant-section"
        aria-label={savedOnly ? 'Saved restaurants' : 'Restaurants'}
      >
        <div className="section-heading restaurants-heading">
          <div>
            <h2>
              {savedOnly
                ? 'Your favorites'
                : category !== 'All'
                  ? category + ' restaurants'
                  : 'Restaurants'}
            </h2>
            <p role="status">
              {filtered.length + (filtered.length === 1 ? ' restaurant' : ' restaurants')}
            </p>
          </div>
          <div className="results-controls">
            {(search || category !== 'All') && filtered.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setParams({})}>
                <X size={15} /> Clear filters
              </Button>
            )}
            <label className="sort-control">
              <SlidersHorizontal size={15} />
              <span className="sr-only">Sort restaurants</span>
              <select value={sort} onChange={(event) => updateParam('sort', event.target.value)}>
                <option value="recommended">Default order</option>
                <option value="name">Name: A to Z</option>
              </select>
            </label>
          </div>
        </div>
        {!filtered.length ? (
          <EmptyState
            title={savedOnly && !ids.length ? 'No saved restaurants yet' : 'No restaurants found'}
            description={
              savedOnly && !ids.length
                ? 'Tap the heart on a restaurant to save it for later.'
                : 'Try another dish, restaurant name, or cuisine.'
            }
            action={
              savedOnly && !ids.length ? (
                <Button asChild variant="outline">
                  <Link to="/">
                    Discover restaurants <ArrowRight size={16} />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setParams({})}>
                  Clear filters <ArrowRight size={16} />
                </Button>
              )
            }
          />
        ) : (
          <div className="restaurant-grid">
            {filtered.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
