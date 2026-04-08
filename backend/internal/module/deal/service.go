package deal

import (
	"context"
	"fmt"

	"github.com/google/uuid"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) GetPaymentPlan(ctx context.Context, dealID string) (*PaymentPlan, error) {
	return s.repo.GetPaymentPlan(ctx, dealID)
}

func (s *Service) CreatePaymentPlan(ctx context.Context, dealID string, in *CreatePaymentPlanInput) (*PaymentPlan, error) {
	stages := in.Stages
	if len(stages) == 0 {
		for _, ds := range DefaultPaymentStages {
			stages = append(stages, struct {
				Label      string  `json:"label"`
				Percentage float64 `json:"percentage"`
			}{ds.Label, ds.Percentage})
		}
	}

	plan := &PaymentPlan{
		ID:       uuid.NewString(),
		DealID:   dealID,
		TotalUSD: in.TotalUSD,
	}

	for _, st := range stages {
		amount := in.TotalUSD * st.Percentage / 100
		plan.Stages = append(plan.Stages, PaymentStage{
			ID:         uuid.NewString(),
			PlanID:     plan.ID,
			Label:      st.Label,
			Percentage: st.Percentage,
			AmountUSD:  &amount,
			Status:     "pending",
		})
	}

	if err := s.repo.CreatePaymentPlan(ctx, plan); err != nil {
		return nil, err
	}
	return plan, nil
}

func (s *Service) UpdatePaymentStage(ctx context.Context, dealID string, in *UpdatePaymentStageInput) error {
	var paidAtStr *string
	if in.PaidAt != nil {
		s := in.PaidAt.Format("2006-01-02T15:04:05Z")
		paidAtStr = &s
	}
	return s.repo.UpdatePaymentStage(ctx, in.StageID, in.Status, in.DueDate, paidAtStr)
}

func (s *Service) GetGuarantees(ctx context.Context, dealID string) ([]*Guarantee, error) {
	return s.repo.GetGuarantees(ctx, dealID)
}

func (s *Service) SetGuarantee(ctx context.Context, dealID string, in *SetGuaranteeInput) error {
	enabled := true
	if in.Enabled != nil {
		enabled = *in.Enabled
	}
	notes := ""
	if in.Notes != nil {
		notes = *in.Notes
	}

	g := &Guarantee{
		ID:      uuid.NewString(),
		DealID:  dealID,
		Type:    in.Type,
		Enabled: enabled,
		Notes:   notes,
	}

	provider, ok := guaranteeProviders[in.Type]
	if !ok {
		return fmt.Errorf("unknown guarantee type: %s", in.Type)
	}
	g.Provider = provider

	return s.repo.SetGuarantee(ctx, g)
}

var guaranteeProviders = map[string]string{
	"export_credit":    "KazakhExport",
	"insurance":        "KazakhExport",
	"letter_of_credit": "Банк-партнёр",
	"bank_guarantee":   "Банк-партнёр",
}
