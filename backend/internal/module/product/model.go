package product

import "time"

type Product struct {
	ID                string    `json:"id" db:"id"`
	Slug              string    `json:"slug" db:"slug"`
	Name              string    `json:"name" db:"name"`
	Category          string    `json:"category" db:"category"`
	HSCode            string    `json:"hsCode" db:"hs_code"`
	MOQ               string    `json:"moq" db:"moq"`
	Incoterms         string    `json:"incoterms" db:"incoterms"`
	Price             string    `json:"price" db:"price"`
	LeadTimeDays      int       `json:"leadTimeDays" db:"lead_time_days"`
	Packaging         string    `json:"packaging" db:"packaging"`
	Description       string    `json:"description" db:"description"`
	ImageURLs         []string  `json:"imageUrls" db:"image_urls"`
	SellerID          string    `json:"sellerId" db:"seller_id"`
	CountryCode       string    `json:"countryCode" db:"country_code"`
	RegionCode        *string   `json:"regionCode,omitempty" db:"region_code"`
	SectorID          string    `json:"sectorId" db:"sector_id"`
	SubcategoryID     string    `json:"subcategoryId" db:"subcategory_id"`
	Tags              []string  `json:"tags" db:"tags"`
	SamplesAvailable  bool      `json:"samplesAvailable" db:"samples_available"`
	PrivateLabel      bool      `json:"privateLabel" db:"private_label"`
	Status            string    `json:"status" db:"status"`
	ModerationComment *string   `json:"moderationComment,omitempty" db:"moderation_comment"`
	CreatedAt         time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt         time.Time `json:"updatedAt" db:"updated_at"`
}

type CreateInput struct {
	Name             string   `json:"name" binding:"required"`
	Category         string   `json:"category"`
	HSCode           string   `json:"hsCode"`
	MOQ              string   `json:"moq"`
	Incoterms        string   `json:"incoterms"`
	Price            string   `json:"price"`
	LeadTimeDays     int      `json:"leadTimeDays"`
	Packaging        string   `json:"packaging"`
	Description      string   `json:"description"`
	ImageURLs        []string `json:"imageUrls"`
	CountryCode      string   `json:"countryCode"`
	RegionCode       string   `json:"regionCode"`
	SectorID         string   `json:"sectorId" binding:"required"`
	SubcategoryID    string   `json:"subcategoryId" binding:"required"`
	Tags             []string `json:"tags"`
	SamplesAvailable bool     `json:"samplesAvailable"`
	PrivateLabel     bool     `json:"privateLabel"`
}

type UpdateInput struct {
	Name              *string  `json:"name"`
	Category          *string  `json:"category"`
	HSCode            *string  `json:"hsCode"`
	MOQ               *string  `json:"moq"`
	Incoterms         *string  `json:"incoterms"`
	Price             *string  `json:"price"`
	LeadTimeDays      *int     `json:"leadTimeDays"`
	Packaging         *string  `json:"packaging"`
	Description       *string  `json:"description"`
	ImageURLs         []string `json:"imageUrls"`
	CountryCode       *string  `json:"countryCode"`
	RegionCode        *string  `json:"regionCode"`
	SectorID          *string  `json:"sectorId"`
	SubcategoryID     *string  `json:"subcategoryId"`
	Tags              []string `json:"tags"`
	SamplesAvailable  *bool    `json:"samplesAvailable"`
	PrivateLabel      *bool    `json:"privateLabel"`
	Status            *string  `json:"status"`
	ModerationComment *string  `json:"moderationComment"`
}

type ListFilter struct {
	Status   string
	SellerID string
	SectorID string
}
