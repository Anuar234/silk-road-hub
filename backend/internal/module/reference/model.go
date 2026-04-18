package reference

type Country struct {
	Code      string `json:"code" db:"code"`
	NameRU    string `json:"nameRu" db:"name_ru"`
	NameEN    string `json:"nameEn" db:"name_en"`
	SortOrder int    `json:"sortOrder" db:"sort_order"`
	IsActive  bool   `json:"isActive" db:"is_active"`
}

type Region struct {
	Code        string `json:"code" db:"code"`
	CountryCode string `json:"countryCode" db:"country_code"`
	NameRU      string `json:"nameRu" db:"name_ru"`
	NameEN      string `json:"nameEn" db:"name_en"`
	SortOrder   int    `json:"sortOrder" db:"sort_order"`
	IsActive    bool   `json:"isActive" db:"is_active"`
}

type Category struct {
	ID        string `json:"id" db:"id"`
	NameRU    string `json:"nameRu" db:"name_ru"`
	NameEN    string `json:"nameEn" db:"name_en"`
	Icon      string `json:"icon" db:"icon"`
	SortOrder int    `json:"sortOrder" db:"sort_order"`
	IsActive  bool   `json:"isActive" db:"is_active"`
}
