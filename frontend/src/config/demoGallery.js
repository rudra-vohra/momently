/**
 * Demo Gallery Configuration
 * Dedicated frontend-only demo experience completely independent of the backend.
 * Stitch Reference: "Jennifer Wedding" public gallery viewing & lightbox.
 */

export const DEMO_PIN = '4928'

export const DEMO_PHOTOS = [
  {
    id: 'demo-photo-1',
    filename: '01-ceremony-chairs.png',
    url: '/demo-photos/01-ceremony-chairs.png',
    thumbnail_url: '/demo-photos/01-ceremony-chairs.png',
    caption: 'Outdoor ceremony arrangement with florals and vineyard view',
  },
  {
    id: 'demo-photo-2',
    filename: '02-invitation-suite.png',
    url: '/demo-photos/02-invitation-suite.png',
    thumbnail_url: '/demo-photos/02-invitation-suite.png',
    caption: 'Custom calligraphy wedding stationery and envelope suite',
  },
  {
    id: 'demo-photo-3',
    filename: '03-wedding-rings.png',
    url: '/demo-photos/03-wedding-rings.png',
    thumbnail_url: '/demo-photos/03-wedding-rings.png',
    caption: 'Gold wedding bands styled on floral petals',
  },
  {
    id: 'demo-photo-4',
    filename: '04-bridal-bouquet.png',
    url: '/demo-photos/04-bridal-bouquet.png',
    thumbnail_url: '/demo-photos/04-bridal-bouquet.png',
    caption: 'Lush bridal bouquet with white roses and eucalyptus',
  },
  {
    id: 'demo-photo-5',
    filename: '05-groom-cufflinks.png',
    url: '/demo-photos/05-groom-cufflinks.png',
    thumbnail_url: '/demo-photos/05-groom-cufflinks.png',
    caption: 'Groom black tie tuxedo details with vintage cufflinks',
  },
  {
    id: 'demo-photo-6',
    filename: '06-bride-veil.png',
    url: '/demo-photos/06-bride-veil.png',
    thumbnail_url: '/demo-photos/06-bride-veil.png',
    caption: 'Bride in cathedral lace veil in natural morning light',
  },
  {
    id: 'demo-photo-7',
    filename: '07-couple-floral-arch.png',
    url: '/demo-photos/07-couple-floral-arch.png',
    thumbnail_url: '/demo-photos/07-couple-floral-arch.png',
    caption: 'Newlywed portrait beneath romantic garden arch',
  },
  {
    id: 'demo-photo-8',
    filename: '08-golden-hour-portraits.png',
    url: '/demo-photos/08-golden-hour-portraits.png',
    thumbnail_url: '/demo-photos/08-golden-hour-portraits.png',
    caption: 'Golden hour sunset portraits in open meadow',
  },
  {
    id: 'demo-photo-9',
    filename: '09-reception-table-setting.png',
    url: '/demo-photos/09-reception-table-setting.png',
    thumbnail_url: '/demo-photos/09-reception-table-setting.png',
    caption: 'Intimate reception dinner with crystal glassware and candles',
  },
  {
    id: 'demo-photo-10',
    filename: '10-wedding-cake.png',
    url: '/demo-photos/10-wedding-cake.png',
    thumbnail_url: '/demo-photos/10-wedding-cake.png',
    caption: 'Three-tiered artisan wedding cake adorned with fresh blooms',
  },
  {
    id: 'demo-photo-11',
    filename: '11-champagne-toast.png',
    url: '/demo-photos/11-champagne-toast.png',
    thumbnail_url: '/demo-photos/11-champagne-toast.png',
    caption: 'Celebratory champagne toast with guests at twilight',
  },
  {
    id: 'demo-photo-12',
    filename: '12-evening-celebration.png',
    url: '/demo-photos/12-evening-celebration.png',
    thumbnail_url: '/demo-photos/12-evening-celebration.png',
    caption: 'Evening celebration dance under warm fairy lights',
  },
]

export const DEMO_GALLERY_DATA = {
  slug: 'demo',
  event_name: 'Jennifer Wedding',
  photo_count: DEMO_PHOTOS.length,
  photos: DEMO_PHOTOS,
  access_token: 'demo_access_token_mock',
}
