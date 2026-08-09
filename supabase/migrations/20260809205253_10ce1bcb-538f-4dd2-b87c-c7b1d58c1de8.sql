insert into public.feature_flags (key, enabled, label, description)
values (
  'show_portraits',
  false,
  'Show Portraits Gallery',
  'Shows the Portraits gallery section on the homepage and its nav link. These are the engagement-portrait session photos, separate from the proposal photos in Our Story.'
)
on conflict (key) do nothing;