curl -X GET \
  'https://YOUR_PROJECT.supabase.co/rest/v1/users?select=*' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  > backup_$(date +%Y%m%d).json
