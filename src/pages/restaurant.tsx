import { useState } from 'react'
import { ArrowLeft, ArrowRight, Heart, Plus, Search } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FoodImage } from '@/components/food-image'
import { EmptyState } from '@/components/feedback'
import { useFavorites } from '@/lib/favorites'
import { money, restaurantPresentation } from '@/lib/presentation'
import { sampleCart, sampleRestaurants } from '@/lib/sample-data'
import type { MenuItem } from '@/lib/types'

export function RestaurantPage() {
  const { id } = useParams()
  const restaurantId = Number(id)
  const restaurant = sampleRestaurants.find((item) => item.id === restaurantId)
  const { ids, toggle } = useFavorites()
  const [search, setSearch] = useState('')
  function addItem(item: MenuItem) {
    // Lesson 22 replaces this with a real POST /cart request.
    toast.info(`${item.name}: adding to the cart connects to the backend in Lesson 22.`)
  }
  if (!restaurant)
    return (
      <div className="page-content">
        <EmptyState
          title="Restaurant not found"
          description="Choose another restaurant to view its menu."
          action={
            <Button asChild>
              <Link to="/">Browse restaurants</Link>
            </Button>
          }
        />
      </div>
    )
  const menu = restaurant.menu_items ?? []
  const meta = restaurantPresentation(restaurant, menu)
  const items = menu.filter((item) =>
    `${item.name} ${item.description ?? ''}`.toLowerCase().includes(search.toLowerCase().trim()),
  )
  const cartCount = sampleCart.order_items.reduce((sum, item) => sum + (item.quantity ?? 1), 0)
  return (
    <div className="page-content menu-page">
      <Link to="/" className="back-link">
        <ArrowLeft size={16} /> All restaurants
      </Link>
      <section className="restaurant-cover">
        {meta.image && (
          <div className="restaurant-cover-photo">
            <FoodImage src={meta.image} alt={restaurant.name} eager />
          </div>
        )}
        <div className="cover-copy">
          {meta.cuisine !== 'All' && <p className="cover-category">{meta.cuisine}</p>}
          <h1>{restaurant.name}</h1>
          {restaurant.address && <p>{restaurant.address}</p>}
        </div>
        <Button
          size="icon"
          className="cover-save"
          variant="secondary"
          aria-label={`${ids.includes(restaurant.id) ? 'Unsave' : 'Save'} ${restaurant.name}`}
          aria-pressed={ids.includes(restaurant.id)}
          onClick={() => toggle(restaurant.id)}
        >
          <Heart size={20} className={ids.includes(restaurant.id) ? 'fill-primary' : ''} />
        </Button>
      </section>
      <div className="menu-toolbar">
        <div>
          <h2>Menu</h2>
          <p>{menu.length} dishes</p>
        </div>
        <div className="menu-search">
          <Search size={17} />
          <Input
            aria-label="Search this menu"
            placeholder="Search this menu"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>
      {!items.length ? (
        <EmptyState
          title={search ? 'No matching dishes' : 'No menu items available'}
          description={
            search
              ? 'Try a different search.'
              : 'This restaurant has no menu items available right now.'
          }
          action={
            search && (
              <Button variant="outline" onClick={() => setSearch('')}>
                Clear search
              </Button>
            )
          }
        />
      ) : (
        <div className="menu-grid">
          {items.map((item) => (
            <article className="menu-item" key={item.id}>
              <div className="menu-item-body">
                <h3>{item.name}</h3>
                {item.description && <p>{item.description}</p>}
                <div className="menu-item-bottom">
                  <strong>{money(item.price)}</strong>
                  <Button
                    size="icon"
                    className="add-button"
                    aria-label={`Add ${item.name} to cart`}
                    onClick={() => addItem(item)}
                  >
                    <Plus size={19} />
                  </Button>
                </div>
              </div>
              {item.image_url && (
                <div className="menu-item-photo">
                  <FoodImage src={item.image_url} alt={item.name} />
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      <p className="menu-note">
        Have a food allergy? Contact the restaurant before ordering.
        {restaurant.phone && <a href={`tel:${restaurant.phone}`}>{restaurant.phone}</a>}
      </p>
      {cartCount > 0 && (
        <div className="floating-cart">
          <span>
            {cartCount} {cartCount === 1 ? 'item' : 'items'} · {money(sampleCart.total_price)}
          </span>
          <Button asChild>
            <Link to="/cart">
              View cart <ArrowRight size={17} />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
