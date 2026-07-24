create or replace view public.talents_list_view as
select
  t.id,
  t.club_id,
  t.first_name,
  t.last_name,
  t.birth_date,
  t.primary_position,
  t.secondary_position,
  t.status,
  t.is_minor,
  t.visibility_status,
  t.review_due_date,
  t.created_at,
  t.updated_at,
  case
    when t.is_minor and not public.current_user_has_youth_access() then null
    else t.club_name_text
  end as club_name_text,
  case
    when t.is_minor and not public.current_user_has_youth_access() then null
    else t.team_name_text
  end as team_name_text,
  case
    when t.is_minor and not public.current_user_has_youth_access() then null
    else t.league_text
  end as league_text,
  case
    when t.is_minor and not public.current_user_has_youth_access() then null
    else t.country_text
  end as country_text,
  case
    when t.is_minor and not public.current_user_has_youth_access() then null
    else t.contract_status
  end as contract_status,
  case
    when t.is_minor and not public.current_user_has_youth_access() then null
    else t.contract_end_date
  end as contract_end_date,
  case
    when t.is_minor and not public.current_user_has_youth_access() then null
    else t.height_cm
  end as height_cm,
  case
    when t.is_minor and not public.current_user_has_youth_access() then null
    else t.weight_kg
  end as weight_kg
from public.talents t
where t.club_id = public.current_user_club_id();