# Eco EFI Check

**A web-based environmental decision-support platform for continuous vehicle-emission assessment using the Engine Freshness Index (EFI).**

**Live application:** https://www.ecoeficheck.org/

## Overview

Eco EFI Check is the web-based implementation of the environmental assessment framework presented in the research study:

**“An AI-Driven Framework for Continuous Environmental Assessment of Vehicle Emissions Using an Engine Freshness Index.”**

Traditional vehicle-emission testing primarily relies on binary pass/fail classifications based on predefined regulatory thresholds. The proposed framework extends this approach by transforming vehicle-emission measurements into a continuous and interpretable environmental assessment using hierarchical machine learning, explainability analysis, diagnostic reasoning, and LLM-assisted insight generation.

The framework introduces the **Engine Freshness Index (EFI)**, a continuous indicator representing the degree to which observed vehicle-emission characteristics deviate from an environmentally favorable combustion state.

Eco EFI Check demonstrates the practical implementation of this framework by integrating EFI estimation, diagnostic reasoning, population-relative emission assessment, and human-readable environmental and maintenance-related insights within a unified web platform.

---

## Platform Features

Eco EFI Check provides:

* EFI estimation from vehicle-emission measurements
* Engine-condition interpretation
* EFI population-percentile comparison
* Relative carbon-monoxide (CO) position assessment
* Rule-based diagnostic indicators
* LLM-assisted diagnostic and environmental insights
* Vehicle-analysis history for authenticated users
* Downloadable assessment reports
* Web-based environmental decision support

---

## Input Features

The deployed EFI model uses vehicle-emission characteristics measured under idle and accelerated operating conditions.

The model inputs include:

| Measurement          | Idle | Accelerated |
| -------------------- | :--: | :---------: |
| Hydrocarbons (HC)    |   ✓  |      ✓      |
| Carbon monoxide (CO) |   ✓  |      ✓      |
| Carbon dioxide (CO₂) |   ✓  |      ✓      |
| Oxygen (O₂)          |   ✓  |      ✓      |
| Lambda (λ)           |   ✓  |      ✓      |
| Engine speed (RPM)   |   ✓  |      ✓      |

These correspond to the emission characteristics used by the EFI prediction model described in the associated research paper.

## System Architecture

The deployed application follows a web-based client–backend architecture.

```text
Vehicle Emission Measurements
            |
            v
      Eco EFI Check
     Web Application
            |
            v
    Supabase Backend
            |
            +--------------------------+
            |                          |
            v                          v
     EFI Prediction              Reference Data
   Random Forest Model            Distributions
            |
            v
   Diagnostic Reasoning
            |
            v
 LLM-Assisted Interpretation
            |
            v
 Environmental Decision Support
```

The frontend provides vehicle-emission data entry and presentation of assessment results. Backend processing is implemented using Supabase services and server-side functions for model inference, diagnostic processing, reference-distribution comparison, and LLM-assisted insight generation.

---

## Technology Stack

| Component          | Technology                   |
| ------------------ | ---------------------------- |
| Frontend           | React, TypeScript, Vite      |
| User interface     | Tailwind CSS, shadcn/ui      |
| Backend            | Supabase Edge Functions      |
| Database           | PostgreSQL                   |
| Authentication     | Supabase Auth / Google OAuth |
| Storage            | Supabase Storage             |
| ML model           | Random Forest regression     |
| Model development  | Python / scikit-learn        |
| Deployed inference | TypeScript                   |
| Generative AI      | LLM API integration          |

---

## Project Structure

The main application components are organised approximately as follows:

```text
.
├── public/
│
├── src/
│   ├── components/
│   ├── hooks/
│   ├── integrations/
│   └── pages/
│
├── supabase/
│   ├── functions/
│   │   └── predict_efi/
│   └── migrations/
│
├── package.json
└── README.md
```

The `src/` directory contains the web-interface components and application pages, while `supabase/` contains backend functions and database-related resources used by the deployed platform.

---

## Running the Web Application Locally

### Requirements

* Node.js 18 or later
* npm
* A configured Supabase project for backend functionality

Clone the repository:

```bash
git clone <repository-url>
cd <repository-directory>
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

A local frontend instance will then be available at the address reported by Vite.

### Environment Configuration

The application requires the appropriate Supabase configuration variables.

For example:

```env
VITE_SUPABASE_URL=<supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
VITE_SUPABASE_PROJECT_ID=<project-id>
```

Backend services and external APIs may require additional secrets. API keys, service-role credentials, and other private credentials must **not** be committed to the repository.

---

## Research Data

The vehicle-emission inspection data used to develop and evaluate the framework were obtained from the **Vehicle Emission Testing Programme of the Department of Motor Traffic, Sri Lanka**.

The original research dataset is **not included in this repository**. Datasets used and analyzed during the current study are available from the corresponding
author upon request.

Consequently, cloning this repository does not provide the original vehicle-emission records used for model development and independent evaluation.

The repository contains the software components and supporting resources that can be publicly distributed by the authors.

---

## Reproducibility

The repository accompanies the associated research publication and is intended to provide transparency regarding the software implementation of the proposed framework.

The deployed EFI prediction model was developed from the methodology described in the paper. Researchers seeking to reproduce the complete model-development procedure should refer to the associated publication for details concerning:

* data preprocessing;
* feature selection;
* EFI formulation;
* clustering and clean-reference identification;
* supervised EFI prediction;
* independent evaluation;
* explainability analysis;
* diagnostic reasoning; and
* LLM evaluation.

Complete reproduction of the reported model-development results requires access to the original vehicle-emission dataset, which cannot be redistributed through this repository.

---

## Limitations

* The EFI is a **research-based environmental assessment indicator** and is not a regulatory vehicle-emission or roadworthiness certification.
* The trained model reflects the vehicle population represented in the research dataset.
* Population-relative EFI and emission comparisons should not be interpreted as globally representative vehicle-population statistics.
* Results depend on the accuracy and quality of the emission measurements supplied to the platform.
* LLM-generated explanations are intended as decision-support information and should not be interpreted as definitive mechanical diagnoses.
* Maintenance-related recommendations do not replace inspection by a qualified automotive technician.
* The platform demonstrates the practical implementation of the proposed research framework and should be interpreted in conjunction with the associated publication.

---

## Associated Publication

**J. Bandara and R. Nawarathna**

*An AI-Driven Framework for Continuous Environmental Assessment of Vehicle Emissions Using an Engine Freshness Index*

Submitted to **Environmental Modelling & Software**.

---

## Authors

**Janath Bandara**
Department of Statistics and Computer Science
University of Peradeniya
Peradeniya 20400, Sri Lanka

**Ruwan Nawarathna**
Department of Statistics and Computer Science
University of Peradeniya
Peradeniya 20400, Sri Lanka

---

## Citation

If you use Eco EFI Check or the associated methodology in academic research, please cite the corresponding research publication.

A complete bibliographic citation and DOI will be added to this repository following publication.

---

## License

Until a formal software license is provided, no additional rights to reuse, modify, or redistribute the source code should be assumed.
